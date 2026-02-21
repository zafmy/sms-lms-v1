"use client";

interface BadgeData {
  id: number;
  name: string;
  description: string;
  iconUrl: string | null;
  earnedAt: Date;
}

const RecentBadges = ({ badges }: { badges: BadgeData[] }) => {
  if (badges.length === 0) {
    return (
      <div className="bg-white p-4 rounded-md">
        <h2 className="text-lg font-semibold mb-2">Recent Badges</h2>
        <p className="text-gray-400 text-sm">
          No badges earned yet. Start learning!
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 rounded-md">
      <h2 className="text-lg font-semibold mb-3">Recent Badges</h2>
      <div className="flex flex-col gap-3">
        {badges.map((badge) => (
          <div
            key={badge.id}
            className="flex items-center gap-3 border border-gray-100 rounded-md p-2"
          >
            {/* Badge icon or default */}
            <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center shrink-0">
              {badge.iconUrl ? (
                <img
                  src={badge.iconUrl}
                  alt={badge.name}
                  className="w-6 h-6"
                />
              ) : (
                <span className="text-yellow-600 text-lg">&#128737;</span>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{badge.name}</p>
              <p className="text-xs text-gray-400">
                {new Date(badge.earnedAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecentBadges;
