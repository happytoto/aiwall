import { DURATION, type TrackId } from './project';

const SAMPLE_RATE = 44100;
const midi = (note: number) => 440 * 2 ** ((note - 69) / 12);

async function compose(track: TrackId): Promise<AudioBuffer> {
  const context = new OfflineAudioContext(1, SAMPLE_RATE * DURATION, SAMPLE_RATE);
  const bus = context.createGain();
  bus.gain.value = 0.72;
  const compressor = context.createDynamicsCompressor();
  compressor.threshold.value = -16;
  compressor.ratio.value = 3;
  bus.connect(compressor);
  compressor.connect(context.destination);

  const reverb = context.createConvolver();
  const impulse = context.createBuffer(1, SAMPLE_RATE * 2.6, SAMPLE_RATE);
  const impulseData = impulse.getChannelData(0);
  let seed = 27;
  for (let i = 0; i < impulseData.length; i++) {
    seed = (seed * 16807) % 2147483647;
    impulseData[i] = ((seed / 2147483647) * 2 - 1) * (1 - i / impulseData.length) ** 3;
  }
  reverb.buffer = impulse;
  const wet = context.createGain();
  wet.gain.value = track === 'electronic' ? 0.13 : 0.28;
  reverb.connect(wet);
  wet.connect(bus);

  const note = (pitch: number, start: number, duration: number, volume: number, voice: 'piano' | 'pad' | 'pluck') => {
    if (start >= DURATION - 1) return;
    const length = Math.min(duration, DURATION - start);
    const envelope = context.createGain();
    const filter = context.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = voice === 'pad' ? 1250 : 3800;
    filter.Q.value = 0.2;
    filter.connect(envelope);
    envelope.connect(bus);
    envelope.connect(reverb);
    const attack = voice === 'pad' ? Math.min(0.9, length * 0.3) : 0.013;
    envelope.gain.setValueAtTime(0.0001, start);
    envelope.gain.exponentialRampToValueAtTime(volume, start + attack);
    envelope.gain.exponentialRampToValueAtTime(Math.max(0.0002, volume * 0.15), start + length * 0.7);
    envelope.gain.exponentialRampToValueAtTime(0.0001, start + length);

    const oscillator = context.createOscillator();
    oscillator.type = voice === 'pad' ? 'triangle' : 'sine';
    oscillator.frequency.value = midi(pitch);
    oscillator.connect(filter);
    oscillator.start(start);
    oscillator.stop(start + length + 0.01);

    if (voice === 'piano') {
      const overtone = context.createOscillator();
      const overtoneGain = context.createGain();
      overtone.type = 'sine';
      overtone.frequency.value = midi(pitch) * 2.003;
      overtoneGain.gain.value = 0.19;
      overtone.connect(overtoneGain);
      overtoneGain.connect(filter);
      overtone.start(start);
      overtone.stop(start + length + 0.01);
    }
  };

  const bpm = track === 'electronic' ? 92 : 69;
  const beat = 60 / bpm;
  const chords = [[50, 57, 62, 66], [47, 54, 59, 62], [43, 50, 55, 59], [45, 52, 57, 61]];
  const melody = [74, 69, 66, 64, 66, 71, 69, 62, 67, 71, 74, 78, 76, 73, 69, 73];

  for (let bar = 0; bar * beat * 4 < DURATION - 2; bar++) {
    const start = bar * beat * 4 + 0.1;
    const chord = chords[bar % chords.length];
    const lift = start > 26 ? 1.15 : 0.85;
    if (track === 'piano') {
      chord.forEach((pitch, i) => note(pitch, start + i * beat * 0.44, beat * 3.1, 0.12 * lift, 'piano'));
      if (bar > 0) note(melody[bar % melody.length], start + beat * 2, beat * 2.1, 0.12 * lift, 'piano');
      if (bar > 6) note(chord[2] + 12, start + beat * 3.25, beat * 1.1, 0.06, 'piano');
    } else if (track === 'electronic') {
      note(chord[0] - 12, start, beat * 3.8, 0.16, 'pad');
      for (let i = 0; i < 8; i++) {
        note(chord[i % 4] + (i > 3 ? 12 : 0), start + i * beat * 0.5, beat * 0.8, (i % 2 ? 0.08 : 0.12) * lift, 'pluck');
      }
      if (bar > 5) note(melody[bar % melody.length], start, beat * 3, 0.08, 'pad');
    } else {
      chord.forEach((pitch, i) => note(pitch, start + i * 0.05, beat * 4.5, 0.075 * lift, 'pad'));
      note(melody[bar % melody.length], start + beat, beat * 2.8, 0.105 * lift, 'piano');
      if (bar > 6) note(chord[3] + 12, start + beat * 2, beat * 3, 0.045, 'pad');
    }
  }

  bus.gain.setValueAtTime(0.72, DURATION - 3);
  bus.gain.linearRampToValueAtTime(0, DURATION);
  return context.startRendering();
}

export class SoundEngine {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private source: AudioBufferSourceNode | null = null;
  private buffers = new Map<TrackId, Promise<AudioBuffer>>();
  private startedAt = 0;
  private offset = 0;
  private looping = false;
  private request = 0;
  private volume = 0.8;

  getBuffer(track: TrackId) {
    if (!this.buffers.has(track)) {
      const buffer = compose(track).catch((error) => {
        this.buffers.delete(track);
        throw error;
      });
      this.buffers.set(track, buffer);
    }
    return this.buffers.get(track)!;
  }

  async play(track: TrackId, offset = 0, loop = false) {
    this.stop();
    const request = ++this.request;
    if (!this.context) {
      this.context = new AudioContext();
      this.master = this.context.createGain();
      this.master.connect(this.context.destination);
    }
    await this.context.resume();
    const buffer = await this.getBuffer(track);
    if (request !== this.request || !this.context || !this.master) return false;
    this.source = this.context.createBufferSource();
    this.source.buffer = buffer;
    this.source.loop = loop;
    this.source.connect(this.master);
    this.master.gain.value = this.volume;
    this.offset = Math.max(0, Math.min(offset, DURATION - 0.01));
    this.startedAt = this.context.currentTime;
    this.looping = loop;
    this.source.start(0, this.offset);
    return true;
  }

  get position() {
    if (!this.context || !this.source) return this.offset;
    const position = this.offset + this.context.currentTime - this.startedAt;
    return this.looping ? position % DURATION : Math.min(position, DURATION);
  }

  setVolume(volume: number) {
    this.volume = volume;
    if (this.context && this.master) this.master.gain.setTargetAtTime(volume, this.context.currentTime, 0.035);
  }

  setLoop(loop: boolean) {
    const position = this.position;
    this.offset = position;
    this.startedAt = this.context?.currentTime ?? 0;
    this.looping = loop;
    if (this.source) this.source.loop = loop;
  }

  stop() {
    this.request++;
    if (this.source) {
      this.offset = this.position;
      this.source.stop();
      this.source.disconnect();
      this.source = null;
    }
  }

  destroy() {
    this.stop();
    void this.context?.close();
    this.context = null;
  }

  async toWav(track: TrackId) {
    const buffer = await this.getBuffer(track);
    const samples = buffer.getChannelData(0);
    const data = new ArrayBuffer(44 + samples.length * 2);
    const view = new DataView(data);
    const write = (offset: number, value: string) => {
      for (let i = 0; i < value.length; i++) view.setUint8(offset + i, value.charCodeAt(i));
    };
    write(0, 'RIFF');
    view.setUint32(4, 36 + samples.length * 2, true);
    write(8, 'WAVE');
    write(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, buffer.sampleRate, true);
    view.setUint32(28, buffer.sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    write(36, 'data');
    view.setUint32(40, samples.length * 2, true);
    for (let i = 0; i < samples.length; i++) {
      const value = Math.max(-1, Math.min(1, samples[i]));
      view.setInt16(44 + i * 2, value * (value < 0 ? 0x8000 : 0x7fff), true);
    }
    return new Blob([data], { type: 'audio/wav' });
  }
}