import { useTour } from '@/context/TourContext';

const Badges = (): JSX.Element | null => {
  const { completed } = useTour();

  if (!completed.length) return null;

  return (
    <div className="flex space-x-2">
      {completed.map((badge) => (
        <span
          key={badge}
          className="px-2 py-1 text-xs border border-primary rounded"
        >
          {badge}
        </span>
      ))}
    </div>
  );
};

export default Badges;
