export const ConfettiEmoji = ({
  emoji,
  index,
}: {
  emoji: string;
  index: number;
}) => {
  const delay = index * 0.15;
  const duration = 2 + (index % 3) * 0.5;
  const left = 5 + ((index * 11.5) % 90);

  return (
    <span
      className="absolute text-2xl animate-confetti-fall pointer-events-none opacity-80"
      style={{
        left: `${left}%`,
        top: "-30px",
        animationDelay: `${delay}s`,
        animationDuration: `${duration}s`,
      }}
    >
      {emoji}
    </span>
  );
};
