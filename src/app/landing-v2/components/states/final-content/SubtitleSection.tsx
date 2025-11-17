interface SubtitleSectionProps {
  show: boolean;
  isMobile: boolean;
}

export default function SubtitleSection({ show, isMobile }: SubtitleSectionProps) {
  return (
    <div
      className={`transition-all duration-500 ease-out ${isMobile ? 'px-[60px]' : 'px-[20px]'}`}
      style={{
        opacity: show ? 1 : 0,
        transform: `translateY(${show ? 0 : 20}px)`,
        marginTop: '8px',
      }}
    >
      <p className="text-white/80 tracking-wide text-center" style={{ fontFamily: 'Saira, sans-serif', fontSize: isMobile ? '11.9px' : '14px' }}>
        An epic idle strategy game where Mekanism NFTs build empires.
      </p>
    </div>
  );
}
