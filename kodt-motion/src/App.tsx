import { useCallback, useEffect, useId, useRef, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowDown, ArrowDownToLine, ArrowRight, ArrowUp, ArrowUpRight, Check, ChevronLeft, ChevronRight, FileText, Headphones, LoaderCircle, Maximize2, Menu, Music2, Pause, Play, Repeat2, RotateCcw, Volume2, VolumeX, X } from 'lucide-react';
import { MotionCanvas } from './MotionCanvas';
import { SoundEngine } from './sound';
import { DURATION, downloadBlob, downloadGuide, formatTime, scenes, tracks, type TrackId } from './project';

function BrandMark({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 42 46" fill="none" aria-hidden="true">
      <path d="M18.8 24.5C8.8 38.7 4.8 28.6 8.5 23.2C12.8 16.9 21.4 28.4 25.6 22.1C31.7 12.9 27 7.4 22.7 12.3L12.8 28.2" stroke="currentColor" strokeWidth="5.8" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="31.7" cy="7.1" r="3.2" fill="currentColor" />
    </svg>
  );
}

function SceneArtwork({ index }: { index: number }) {
  const unique = useId().replace(/:/g, '');
  const gradient = `copper-${unique}`;
  return (
    <svg className="scene-artwork" viewBox="0 0 240 145" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id={gradient} x1="60" y1="35" x2="170" y2="115" gradientUnits="userSpaceOnUse">
          <stop stopColor="#e88e64" /><stop offset=".45" stopColor="#c25a33" /><stop offset="1" stopColor="#a84222" />
        </linearGradient>
      </defs>
      {index === 0 && <><circle cx="120" cy="70" r="27" stroke="#d5c9bd" strokeWidth="1" /><circle cx="120" cy="70" r="27" stroke={`url(#${gradient})`} strokeWidth="8" opacity=".75" /><circle cx="120" cy="70" r="42" stroke="#c9b9a7" strokeDasharray="1 6" opacity=".5" /></>}
      {index === 1 && <><circle cx="120" cy="70" r="29" stroke={`url(#${gradient})`} strokeWidth="9" /><text x="120" y="125" textAnchor="middle" className="diagram-label">HUMAN</text></>}
      {index === 2 && <><ellipse cx="120" cy="74" rx="28" ry="27" transform="rotate(-24 120 74)" stroke={`url(#${gradient})`} strokeWidth="9" /><path d="M83 52C92 30 132 24 151 48M151 48L151 38M151 48L140 45" stroke="#9c8f80" strokeWidth="1.2" strokeLinecap="round" /><path d="M158 94C150 110 124 117 104 110" stroke="#bfb2a3" strokeWidth="1" strokeDasharray="2 3" /></>}
      {index === 3 && <><circle cx="77" cy="70" r="26" stroke={`url(#${gradient})`} strokeWidth="9" /><circle cx="165" cy="70" r="26" stroke="#8c9990" strokeWidth="9" /><path d="M115 70H128M124 66L129 70L124 74" stroke="#b7aa9c" strokeWidth="1.2" /><text x="77" y="122" textAnchor="middle" className="diagram-label">HUMAN</text><text x="165" y="122" textAnchor="middle" className="diagram-label">TECHNOLOGY</text></>}
      {index === 4 && <><circle cx="100" cy="72" r="29" stroke={`url(#${gradient})`} strokeWidth="9" /><circle cx="143" cy="72" r="29" stroke="#8c9990" strokeWidth="9" opacity=".9" /><path d="M82 33C100 22 141 23 159 35M159 35L155 26M159 35L149 36" stroke="#ac9b89" strokeWidth="1.1" /></>}
      {index >= 5 && <g transform={index >= 7 ? 'translate(120 72) rotate(-45) translate(-120 -72)' : undefined}>
        <path className="infinity-line" d="M120 72C99 35 60 38 60 72C60 106 99 109 120 72C141 35 180 38 180 72C180 106 141 109 120 72Z" stroke={`url(#${gradient})`} strokeWidth="10" strokeLinecap="round" />
        {index === 6 && <path d="M72 33C87 22 108 25 119 34M119 34L116 25M119 34L109 35M167 113C152 124 133 119 122 111" stroke="#a99886" strokeWidth="1.1" />}
      </g>}
      {index === 8 && <circle cx="175" cy="22" r="6" fill={`url(#${gradient})`} />}
    </svg>
  );
}

const reveal = { initial: { opacity: 0, y: 18 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, amount: 0.15 }, transition: { duration: 0.65 } };

export default function App() {
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [started, setStarted] = useState(false);
  const [muted, setMuted] = useState(false);
  const [loop, setLoop] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState<TrackId>('piano');
  const [previewTrack, setPreviewTrack] = useState<TrackId | null>(null);
  const [previewTime, setPreviewTime] = useState(0);
  const [busy, setBusy] = useState<'motion' | TrackId | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [notes, setNotes] = useState<'motion' | 'sound' | null>(null);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [activeNav, setActiveNav] = useState('overview');
  const [notice, setNotice] = useState('');
  const engineRef = useRef<SoundEngine | null>(null);
  const requestRef = useRef(0);
  const stageRef = useRef<HTMLDivElement>(null);
  const storyboardRef = useRef<HTMLDivElement>(null);
  const previewResume = useRef<{ id: TrackId | null; time: number }>({ id: null, time: 0 });
  const silentClock = useRef<{ active: boolean; offset: number; startedAt: number }>({ active: false, offset: 0, startedAt: 0 });
  const scrubPlaying = useRef(false);
  const reducedMotion = useReducedMotion();
  const currentScene = Math.max(0, scenes.findIndex((scene) => time >= scene.start && time < scene.end));
  const sceneIndex = time >= DURATION ? 8 : currentScene;
  const lockupOpacity = started ? Math.max(0, Math.min(1, (time - 43.8) / 3)) : 1;
  const closeNotes = useCallback(() => setNotes(null), []);

  const getEngine = useCallback(() => {
    if (!engineRef.current) engineRef.current = new SoundEngine();
    return engineRef.current;
  }, []);

  const stopAll = useCallback(() => {
    requestRef.current++;
    engineRef.current?.stop();
    setPlaying(false);
    setPreviewTrack(null);
    setBusy(null);
  }, []);

  const startMotion = useCallback(async (offset: number, track = selectedTrack) => {
    const request = ++requestRef.current;
    setPlaying(false);
    setPreviewTrack(null);
    setStarted(true);
    setTime(offset >= DURATION ? 0 : offset);
    setBusy('motion');
    const position = offset >= DURATION ? 0 : offset;
    try {
      const engine = getEngine();
      engine.setVolume(muted ? 0 : 0.8);
      const ready = await engine.play(track, position, loop);
      if (request !== requestRef.current || !ready) return;
      silentClock.current.active = false;
      setPlaying(true);
    } catch {
      if (request !== requestRef.current) return;
      silentClock.current = { active: true, offset: position, startedAt: performance.now() };
      setMuted(true);
      setPlaying(true);
      setNotice('사운드를 시작할 수 없어 무음으로 모션을 재생합니다.');
    } finally {
      if (request === requestRef.current) setBusy(null);
    }
  }, [getEngine, loop, muted, selectedTrack]);

  const toggleMotion = useCallback(() => {
    if (playing || busy === 'motion') stopAll();
    else void startMotion(time);
  }, [playing, busy, stopAll, startMotion, time]);

  const seekTo = useCallback((position: number) => {
    const next = Math.max(0, Math.min(DURATION, position));
    setStarted(true);
    setTime(next);
    if (playing) void startMotion(next);
    else if (previewTrack || busy) stopAll();
  }, [playing, previewTrack, busy, startMotion, stopAll]);

  const selectScene = (index: number) => {
    stopAll();
    setStarted(true);
    setTime(scenes[index].start + (index === 0 ? 2 : 0.35));
  };

  const playPreview = async (track: TrackId) => {
    if (previewTrack === track || busy === track) {
      previewResume.current = { id: track, time: previewTime };
      stopAll();
      return;
    }
    stopAll();
    const request = ++requestRef.current;
    setBusy(track);
    setSelectedTrack(track);
    const offset = previewResume.current.id === track && previewResume.current.time < DURATION - 0.2 ? previewResume.current.time : 0;
    setPreviewTime(offset);
    try {
      const engine = getEngine();
      engine.setVolume(0.8);
      setMuted(false);
      const ready = await engine.play(track, offset);
      if (request === requestRef.current && ready) setPreviewTrack(track);
    } catch {
      setNotice('이 브라우저에서 사운드를 재생할 수 없습니다. 최신 브라우저에서 다시 시도해 주세요.');
    } finally {
      if (request === requestRef.current) setBusy(null);
    }
  };

  const chooseTrack = (track: TrackId) => {
    setSelectedTrack(track);
    if (playing) void startMotion(time, track);
    else if (previewTrack && previewTrack !== track) stopAll();
  };

  const toggleMute = () => {
    getEngine().setVolume(muted ? 0.8 : 0);
    setMuted(!muted);
  };

  const toggleLoop = () => {
    if (playing) engineRef.current?.setLoop(!loop);
    if (playing && silentClock.current.active) {
      silentClock.current = { active: true, offset: time, startedAt: performance.now() };
    }
    setLoop(!loop);
  };

  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else if (stageRef.current?.requestFullscreen) await stageRef.current.requestFullscreen();
      else setNotice('이 브라우저에서는 전체 화면을 지원하지 않습니다.');
    } catch {
      setNotice('전체 화면으로 전환하지 못했습니다. 브라우저의 전체 화면 설정을 확인해 주세요.');
    }
  };

  const downloadSound = async () => {
    setDownloading(true);
    try {
      const blob = await getEngine().toWav(selectedTrack);
      downloadBlob(blob, `KoDT-${selectedTrack}-sound-sketch.wav`);
      setNotice('48초 사운드 스케치가 WAV 파일로 다운로드됩니다.');
    } catch {
      setNotice('사운드 파일을 만들지 못했습니다. 잠시 후 다시 시도해 주세요.');
    } finally { setDownloading(false); }
  };

  useEffect(() => {
    if (!playing && !previewTrack) return;
    let frame = 0;
    let previous = 0;
    const update = (now: number) => {
      frame = requestAnimationFrame(update);
      if (now - previous < 45) return;
      previous = now;
      let position = engineRef.current?.position ?? 0;
      if (playing && silentClock.current.active) {
        position = silentClock.current.offset + (now - silentClock.current.startedAt) / 1000;
        if (loop) position %= DURATION;
      }
      if (playing) setTime(Math.min(position, DURATION));
      else if (previewTrack) {
        setPreviewTime(position);
        previewResume.current = { id: previewTrack, time: position };
      }
      if (position >= DURATION - 0.025 && !(playing && loop)) {
        if (playing) setTime(DURATION);
        else previewResume.current = { id: null, time: 0 };
        stopAll();
      }
    };
    frame = requestAnimationFrame(update);
    return () => cancelAnimationFrame(frame);
  }, [playing, previewTrack, loop, stopAll]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (notes || ['INPUT', 'BUTTON', 'A', 'TEXTAREA'].includes(target.tagName) || target.isContentEditable) return;
      if (event.code === 'Space') { event.preventDefault(); toggleMotion(); }
      if (event.code === 'ArrowRight') { event.preventDefault(); seekTo(time + 5); }
      if (event.code === 'ArrowLeft') { event.preventDefault(); seekTo(time - 5); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [notes, toggleMotion, seekTo, time]);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) if (entry.isIntersecting) setActiveNav(entry.target.id);
    }, { rootMargin: '-12% 0px -55% 0px', threshold: 0 });
    ['overview', 'storyboard', 'sound'].forEach((id) => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(() => setNotice(''), 5000);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  useEffect(() => () => { requestRef.current++; engineRef.current?.destroy(); engineRef.current = null; }, []);

  const navigate = (id: string) => {
    setActiveNav(id);
    setMobileMenu(false);
  };

  return (
    <>
      <header className="site-header">
        <a href="#overview" className="brand" onClick={() => navigate('overview')} aria-label="KoDT 프로젝트 처음으로">
          <BrandMark className="brand-symbol" /><span className="brand-name">KoDT</span><span className="brand-full">KOREA<br />DIGITAL TRUST</span>
        </a>
        <nav className={`main-nav ${mobileMenu ? 'is-open' : ''}`} aria-label="주요 메뉴">
          {[['overview', '로고 모션'], ['storyboard', '스토리보드'], ['sound', '음악 레퍼런스']].map(([id, label]) => (
            <a key={id} className={activeNav === id ? 'active' : ''} href={`#${id}`} onClick={() => navigate(id)}>{label}</a>
          ))}
        </nav>
        <button className="notes-link" onClick={() => setNotes('motion')}><FileText size={15} strokeWidth={1.5} /><span>프로젝트 노트</span><ArrowUpRight size={15} /></button>
        <button className="mobile-menu icon-button" onClick={() => setMobileMenu(!mobileMenu)} aria-label={mobileMenu ? '메뉴 닫기' : '메뉴 열기'} aria-expanded={mobileMenu}>{mobileMenu ? <X size={21} /> : <Menu size={21} />}</button>
      </header>

      <main>
        <section id="overview" className="overview-section">
          <div className="hero-intro page-width">
            <motion.div initial={{ opacity: 0, y: reducedMotion ? 0 : 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.65 }}>
              <p className="eyebrow"><span className="orange-dot" /> BRAND MOTION & SOUND</p>
              <h1><span className="hero-brand">KoDT.</span> 신뢰를 잇는 움직임.</h1>
            </motion.div>
            <motion.p className="hero-description" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 0.25 }}>인간과 기술의 만남,<br /> 함께 진화하는 연결의 이야기.</motion.p>
          </div>

          <div className="player-shell" ref={stageRef}>
            <motion.div className="motion-stage" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 0.12 }}>
              <MotionCanvas time={time} playing={playing} started={started} />
              <div className="stage-wordmark" style={{ opacity: lockupOpacity }} aria-hidden={lockupOpacity === 0}>
                <span>KoDT</span><p>KOREA DIGITAL TRUST</p>
              </div>
              <div className="stage-signature">HUMANITAS & TECHNOLOGIA,<br />EVOLVING TOGETHER.</div>
              <div className="stage-edition"><span className="edition-line" /> A STUDY OF CONNECTION</div>
            </motion.div>
            <div className="player-controls page-width">
              <button className="main-play" onClick={toggleMotion} aria-label={playing ? '모션 일시 정지' : busy === 'motion' ? '모션 준비 취소' : '모션 재생'} title="재생 / 일시 정지 (Space)">
                {busy === 'motion' ? <LoaderCircle className="spin" size={19} /> : playing ? <Pause size={17} fill="currentColor" /> : <Play size={17} fill="currentColor" className="play-triangle" />}
              </button>
              <div className="play-description"><span>{started ? `${String(sceneIndex + 1).padStart(2, '0')}. ${scenes[sceneIndex].title}` : '브랜드 모션 프리뷰'}</span><small>{playing ? 'NOW PLAYING' : busy === 'motion' ? 'PREPARING SOUND' : '9 SCENES / 48 SECONDS'}</small></div>
              <span className="time-current">{formatTime(time)}</span>
              <div className="seek-wrap">
                <div className="seek-chapters" aria-hidden="true">{scenes.slice(1).map((scene) => <i key={scene.start} style={{ left: `${scene.start / DURATION * 100}%` }} />)}</div>
                <input className="seek-range" type="range" min="0" max={DURATION} step="0.05" value={time} aria-label="모션 재생 위치" aria-valuetext={`${formatTime(time)}, ${scenes[sceneIndex].title}`} style={{ '--progress': `${time / DURATION * 100}%` } as CSSProperties} onPointerDown={() => { scrubPlaying.current = playing; if (playing) stopAll(); }} onChange={(event) => seekTo(Number(event.target.value))} onPointerUp={(event) => { if (scrubPlaying.current) { scrubPlaying.current = false; void startMotion(Number(event.currentTarget.value)); } }} />
              </div>
              <span className="time-total">{formatTime(DURATION)}</span>
              <div className="player-tools">
                <button className={`icon-button ${muted ? 'is-muted' : ''}`} onClick={toggleMute} aria-label={muted ? '소리 켜기' : '소리 끄기'} aria-pressed={muted} title={muted ? '소리 켜기' : '소리 끄기'}>{muted ? <VolumeX size={18} /> : <Volume2 size={18} />}</button>
                <button className={`icon-button repeat-button ${loop ? 'is-active' : ''}`} onClick={toggleLoop} aria-label="반복 재생" aria-pressed={loop} title="반복 재생"><Repeat2 size={18} /></button>
                <button className="icon-button replay-button" onClick={() => void startMotion(0)} aria-label="처음부터 다시 재생" title="처음부터 다시 재생"><RotateCcw size={16} /></button>
                <span className="tool-divider" />
                <button className="icon-button" onClick={() => void toggleFullscreen()} aria-label="전체 화면" title="전체 화면"><Maximize2 size={17} /></button>
              </div>
            </div>
          </div>
          <div className="under-player page-width"><span><span className="live-dot" /> HUMAN + TECHNOLOGY, IN MOTION</span><span><Headphones size={12} /> 사운드와 함께 감상해 보세요.</span></div>
        </section>

        <motion.section {...reveal} id="storyboard" className="storyboard-section page-width">
          <div className="section-heading">
            <div><p className="eyebrow section-eyebrow"><span>01</span> THE STORYBOARD</p><h2>두 개의 원, 하나의 이야기.</h2></div>
            <div className="storyboard-heading-right"><p>작은 시작에서 무한한 가능성까지, 9개의 장면.</p><div className="carousel-controls"><button className="arrow-button" onClick={() => storyboardRef.current?.scrollBy({ left: -460, behavior: 'smooth' })} aria-label="이전 장면 보기"><ChevronLeft size={18} /></button><button className="arrow-button" onClick={() => storyboardRef.current?.scrollBy({ left: 460, behavior: 'smooth' })} aria-label="다음 장면 보기"><ChevronRight size={18} /></button></div></div>
          </div>
          <div className="storyboard-track" ref={storyboardRef}>
            {scenes.map((scene, index) => (
              <button key={scene.title} className={`scene-button ${sceneIndex === index ? 'is-selected' : ''}`} onClick={() => selectScene(index)} aria-label={`${index + 1}번 장면, ${scene.title}, ${formatTime(scene.start)}로 이동`} aria-pressed={sceneIndex === index}>
                <div className="scene-preview"><div className="scene-topline"><span>{String(index + 1).padStart(2, '0')}</span><span>{formatTime(scene.start)}<span className="scene-time-dash">-</span>{formatTime(scene.end)}</span></div><SceneArtwork index={index} /><div className="scene-preview-play"><Play size={12} fill="currentColor" /></div></div>
                <div className="scene-label"><h3>{scene.title}</h3><ArrowUpRight size={14} /></div><p className="scene-description">{scene.description}</p>
              </button>
            ))}
          </div>
          <div className="storyboard-bottom"><span>장면을 선택해 움직임을 자세히 살펴보세요.</span><button className="text-link" onClick={() => setNotes('motion')}>스토리 노트 보기 <ArrowUpRight size={13} /></button></div>
        </motion.section>

        <section id="sound" className="sound-section">
          <motion.div {...reveal} className="sound-layout page-width">
            <div className="sound-intro"><p className="eyebrow section-eyebrow"><span>02</span> THE SOUND DIRECTION</p><h2>움직임에,<br />감정을 더하다.</h2><p className="sound-description">고요한 시작에서 깊은 울림까지.<br />연결의 리듬을 완성하는 사운드.</p><button className="text-link sound-notes-link" onClick={() => setNotes('sound')}><Music2 size={14} /> 음악 디렉션 노트 <ArrowUpRight size={13} /></button></div>
            <div className="sound-content">
              <div className="sound-list-heading"><span>모션과 함께할 사운드를 선택해 보세요.</span><button className="text-link" onClick={() => void downloadSound()} disabled={downloading}>{downloading ? <LoaderCircle size={13} className="spin" /> : <ArrowDownToLine size={13} />}<span>{downloading ? '파일 준비 중' : '사운드 다운로드'}</span></button></div>
              <div className="sound-track-list">
                {tracks.map((track, index) => {
                  const isCurrent = previewTrack === track.id;
                  const isSelected = selectedTrack === track.id;
                  const progress = isCurrent ? previewTime / DURATION : playing && isSelected ? time / DURATION : 0;
                  return (
                    <div key={track.id} className={`sound-track ${isSelected ? 'is-selected' : ''} ${isCurrent ? 'is-playing' : ''}`}>
                      <button className="track-play" aria-label={`${track.name} ${isCurrent ? '일시 정지' : '미리 듣기'}`} onClick={() => void playPreview(track.id)}>{busy === track.id ? <LoaderCircle size={16} className="spin" /> : isCurrent ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" className="play-triangle" />}</button>
                      <button className="track-info" onClick={() => chooseTrack(track.id)} aria-label={`${track.name} 사운드 선택`}><span className="track-category">0{index + 1} / {track.category} / {track.bpm} BPM</span><h3>{track.name}</h3><p>{track.mood}</p></button>
                      <div className="waveform" aria-hidden="true">{Array.from({ length: 46 }, (_, i) => <i key={i} className={i / 46 <= progress && progress > 0 ? 'is-filled' : ''} style={{ height: `${5 + Math.abs(Math.sin(i * 1.7 + index * 3) * Math.cos(i * 0.31)) * 25}px`, animationDelay: `${i * -0.07}s` }} />)}</div>
                      <span className="track-duration">{formatTime(isCurrent ? previewTime : DURATION)}</span>
                      <button className="track-select" onClick={() => chooseTrack(track.id)} aria-label={`${track.name} ${isSelected ? '선택됨' : '모션에 적용'}`} aria-pressed={isSelected}>{isSelected ? <Check size={13} /> : <span />}</button>
                    </div>
                  );
                })}
              </div>
              <p className="sound-disclaimer"><span className="orange-dot" /> 제공된 악보의 흐름을 해석한 합성 사운드 스케치입니다. 원곡 연주 음원이 아닙니다.</p>
            </div>
          </motion.div>
        </section>

        <motion.section {...reveal} className="closing-section page-width"><span className="closing-overline">HUMAN + TECHNOLOGY + TRUST</span><p>서로를 연결하고,<br /><span>더 나은 내일로 함께.</span></p><a href="#overview" className="closing-replay" onClick={() => { navigate('overview'); void startMotion(0); }}><span>다시, 연결의 시작으로</span><ArrowUpRight size={28} strokeWidth={1} /></a></motion.section>
      </main>

      <footer className="site-footer page-width"><a href="#overview" className="footer-brand" aria-label="KoDT 맨 위로"><BrandMark className="footer-symbol" /><span>KoDT</span></a><span className="footer-copyright">© 2026 KOREA DIGITAL TRUST. BRAND MOTION STUDY.</span><div className="footer-actions"><button onClick={downloadGuide}>프로젝트 가이드 <ArrowDown size={13} /></button><a href="#overview" aria-label="맨 위로">BACK TO TOP <ArrowUp size={13} /></a></div></footer>

      <AnimatePresence>{notes && <ProjectNotes initialTab={notes} onClose={closeNotes} onScene={(index) => { selectScene(index); setNotes(null); document.getElementById('overview')?.scrollIntoView({ behavior: 'smooth' }); }} />}</AnimatePresence>
      <AnimatePresence>{notice && <motion.div className="notice" role="status" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}><span>{notice}</span><button aria-label="알림 닫기" onClick={() => setNotice('')}><X size={15} /></button></motion.div>}</AnimatePresence>
    </>
  );
}

function ProjectNotes({ initialTab, onClose, onScene }: { initialTab: 'motion' | 'sound'; onClose: () => void; onScene: (index: number) => void }) {
  const [tab, setTab] = useState(initialTab);
  const panel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const focused = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panel.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key !== 'Tab') return;
      const focusable = panel.current?.querySelectorAll<HTMLElement>('button, a[href], [tabindex="0"]');
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && (document.activeElement === first || document.activeElement === panel.current)) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = overflow; document.removeEventListener('keydown', onKey); focused?.focus(); };
  }, [onClose]);

  return createPortal(
    <motion.div className="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div className="notes-modal" ref={panel} role="dialog" aria-modal="true" aria-labelledby="notes-title" tabIndex={-1} initial={{ opacity: 0, y: 24, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 12 }} onClick={(event) => event.stopPropagation()}>
        <div className="modal-header"><div><p className="eyebrow"><span className="orange-dot" /> KoDT / PROJECT NOTES</p><h2 id="notes-title">연결이 신뢰가 되는 과정.</h2></div><button className="icon-button modal-close" onClick={onClose} aria-label="프로젝트 노트 닫기"><X size={21} /></button></div>
        <p className="modal-intro">제공해 주신 스케치와 악보를 바탕으로 구성한<br className="desktop-break" /> 로고 모션과 사운드의 인터랙티브 콘셉트입니다.</p>
        <div className="notes-tabs" role="tablist" aria-label="프로젝트 노트 종류"><button id="motion-tab" role="tab" aria-selected={tab === 'motion'} aria-controls="notes-content" className={tab === 'motion' ? 'active' : ''} onClick={() => setTab('motion')}>모션 디렉션</button><button id="sound-tab" role="tab" aria-selected={tab === 'sound'} aria-controls="notes-content" className={tab === 'sound' ? 'active' : ''} onClick={() => setTab('sound')}>사운드 노트</button></div>
        <div id="notes-content" className="notes-content" role="tabpanel" aria-labelledby={`${tab}-tab`}>
          {tab === 'motion' ? <><div className="notes-concept"><SceneArtwork index={3} /><ArrowRight size={19} /><SceneArtwork index={5} /><ArrowRight size={19} /><SceneArtwork index={8} /></div><p className="notes-detail-intro">인간과 기술을 상징하는 두 개의 원. 서로를 만나 무한대를 이루고, 45도의 전환을 통해 새로운 가능성으로 이어집니다.</p><div className="notes-scenes">{scenes.map((scene, index) => <button key={scene.title} onClick={() => onScene(index)}><span className="note-scene-number">{String(index + 1).padStart(2, '0')}</span><div><h3>{scene.title}</h3><p>{scene.note}</p></div><span className="note-scene-time">{formatTime(scene.start)}<ArrowUpRight size={13} /></span></button>)}</div></> : <><div className="sound-note-title"><Music2 size={25} strokeWidth={1.2} /><div><h3>조용한 울림에서, 함께하는 진화로.</h3><p>69 BPM / WARM PIANO / GRADUAL EXPANSION</p></div></div><p className="notes-detail-intro">악보에 적힌 69 BPM의 넓은 호흡을 기본 방향으로 삼았습니다. 완만한 피아노 도입에서 두 원의 상호작용에 맞춘 리듬으로, 마지막에는 새로운 가능성이 열리는 여운으로 이어집니다.</p><div className="sound-note-phases"><div><span>00:00 - 00:14</span><h3>고요한 시작</h3><p>여백이 있는 단음과 부드러운 잔향. 인간의 탄생과 창조의 움직임을 담습니다.</p></div><div><span>00:14 - 00:36</span><h3>연결의 리듬</h3><p>화음과 선율이 겹치며 인간과 기술의 상호작용, 무한한 순환을 표현합니다.</p></div><div><span>00:36 - 00:48</span><h3>확장과 여운</h3><p>선율이 높은 음역으로 확장되고, 로고의 완성과 함께 잔향이 천천히 사라집니다.</p></div></div><div className="notes-disclaimer">세 가지 트랙 모두 Web Audio로 합성한 콘셉트 스케치입니다. 제공된 악보를 그대로 연주한 음원이나 공식 브랜드 사운드가 아닙니다. WAV 다운로드로 별도 청취할 수 있습니다.</div></>}
        </div>
        <div className="modal-footer"><span>HUMANITAS & TECHNOLOGIA,<br />EVOLVING TOGETHER.</span><button className="dark-button" onClick={downloadGuide}>프로젝트 가이드 <ArrowDownToLine size={15} /></button></div>
      </motion.div>
    </motion.div>, document.body,
  );
}
