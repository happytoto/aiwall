export const DURATION = 48;

export const scenes = [
  { title: '시작의 울림', start: 0, end: 4, description: '고요한 울림 속, 가능성이 깨어납니다.', note: '음악이 먼저 흐르고, 인간을 상징하는 첫 번째 원이 서서히 나타납니다.' },
  { title: '인간의 탄생', start: 4, end: 9, description: '모든 연결의 시작, 인간을 그립니다.', note: '다빈치의 인체도에서 착안한 원이 인간의 존재와 잠재력을 표현합니다.' },
  { title: '창조의 움직임', start: 9, end: 14, description: '작은 움직임이 새로운 생각이 됩니다.', note: '인간의 원이 가볍게 회전하며 창조적 활동과 탐구를 시작합니다.' },
  { title: '기술의 탄생', start: 14, end: 19, description: '인간의 상상에서 기술이 태어납니다.', note: '인간의 창조에서 두 번째 원, 기술이 탄생합니다. 두 원이 나란히 마주합니다.' },
  { title: '인간과 기술의 만남', start: 19, end: 26, description: '가까워지고 멀어지며, 서로를 발견합니다.', note: '인간과 기술의 두 원이 접근하고 분리되기를 반복하며 상호작용합니다.' },
  { title: '무한한 연결', start: 26, end: 31, description: '서로 다른 두 원이 하나로 이어집니다.', note: '상호작용이 깊어지면서 두 원은 경계 없는 무한대의 형태를 이룹니다.' },
  { title: '함께하는 진화', start: 31, end: 36, description: '끊임없는 흐름 속에서 함께 진화합니다.', note: '무한대의 곡선을 따라 인간과 기술이 끊임없이 순환하며 함께 진화합니다.' },
  { title: '새로운 관점', start: 36, end: 42, description: '45도의 전환, 더 높은 가능성을 향해.', note: '무한대가 반시계 방향으로 45도 회전합니다. 적분 기호를 닮은 새로운 관점이 열립니다.' },
  { title: '가능성의 시작', start: 42, end: 48, description: '새로운 원과 함께, KoDT가 완성됩니다.', note: '인간과 기술의 축적에서 또 하나의 원이 태어납니다. KoDT와 KOREA DIGITAL TRUST가 나타나며 여운을 남깁니다.' },
];

export type TrackId = 'piano' | 'electronic' | 'strings';

export const tracks: { id: TrackId; name: string; category: string; mood: string; bpm: number }[] = [
  { id: 'piano', name: 'A Quiet Beginning', category: 'PIANO & AMBIENT', mood: '고요한 시작, 따뜻하게 번지는 울림', bpm: 69 },
  { id: 'electronic', name: 'A New Connection', category: 'MINIMAL ELECTRONIC', mood: '섬세한 리듬, 유기적인 상호작용', bpm: 92 },
  { id: 'strings', name: 'Beyond Together', category: 'CINEMATIC TEXTURE', mood: '깊은 호흡, 새로운 가능성을 향한 확장', bpm: 69 },
];

export function formatTime(time: number) {
  const value = Math.max(0, Math.floor(time));
  return `${String(Math.floor(value / 60)).padStart(2, '0')}:${String(value % 60).padStart(2, '0')}`;
}

export function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function downloadGuide() {
  const text = [
    'KoDT / KOREA DIGITAL TRUST',
    'BRAND MOTION & SOUND CONCEPT',
    '',
    'Humanitas & Technologia, Evolving Together.',
    '인간과 기술, 함께 진화하는 연결.',
    '',
    '러닝타임: 48초 / 9개 장면',
    '모션: 두 원의 탄생 > 상호작용 > 무한대 > 반시계 45도 회전 > 새로운 원과 KoDT',
    '기본 사운드: A Quiet Beginning / Piano & Ambient / 69 BPM',
    '',
    ...scenes.flatMap((scene, index) => [
      `${String(index + 1).padStart(2, '0')}. ${scene.title} / ${formatTime(scene.start)} - ${formatTime(scene.end)}`,
      scene.note,
      '',
    ]),
    '사운드 레퍼런스',
    ...tracks.map((track) => `${track.name} / ${track.category} / ${track.bpm} BPM / ${track.mood}`),
    '',
    '제공된 스케치와 악보의 흐름을 해석한 인터랙티브 콘셉트입니다.',
    '표시된 로고는 모션 스터디이며 최종 공식 CI가 아닙니다.',
    '사운드는 브라우저에서 합성한 청취용 스케치로, 제공된 악보의 실제 연주 녹음이 아닙니다.',
  ].join('\n');
  downloadBlob(new Blob(['\uFEFF', text], { type: 'text/plain;charset=utf-8' }), 'KoDT-motion-sound-guide.txt');
}