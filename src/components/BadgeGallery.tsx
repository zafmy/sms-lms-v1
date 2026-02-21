"use client";

interface BadgeInfo {
  id: number;
  name: string;
  description: string;
  iconUrl: string | null;
  category: string;
}

interface EarnedBadgeInfo {
  badgeId: number;
  earnedAt: Date;
}

const BadgeGallery = ({
  badges,
  earnedBadges,
}: {
  badges: BadgeInfo[];
  earnedBadges: EarnedBadgeInfo[];
}) => {
  const earnedMap = new Map(
    earnedBadges.map((eb) => [eb.badgeId, eb.earnedAt])
  );

  if (badges.length === 0) {
    return (
      <div className="bg-white p-4 rounded-md">
        <h2 className="text-lg font-semibold mb-2">Badge Gallery</h2>
        <p className="text-gray-400 text-sm">No badges available yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 rounded-md">
      <h2 className="text-lg font-semibold mb-4">Badge Gallery</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {badges.map((badge) => {
          const earnedAt = earnedMap.get(badge.id);
          const isEarned = earnedAt !== undefined;

          return (
            <div
              key={badge.id}
              className={`relative border rounded-md p-3 text-center transition-shadow ${
                isEarned
                  ? "border-yellow-300 bg-yellow-50 hover:shadow-md"
                  : "border-gray-200 bg-gray-50 opacity-60"
              }`}
            >
              {/* Lock icon overlay for unearned badges */}
              {!isEarned && (
                <div className="absolute top-2 right-2 text-gray-400 text-sm">
                  &#128274;
                </div>
              )}

              {/* Badge icon */}
              <div
                className={`w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center ${
                  isEarned ? "bg-yellow-200" : "bg-gray-200"
                }`}
              >
                {badge.iconUrl ? (
                  <img
                    src={badge.iconUrl}
                    alt={badge.name}
                    className={`w-7 h-7 ${!isEarned ? "grayscale" : ""}`}
                  />
                ) : (
                  <span
                    className={`text-xl ${
                      isEarned ? "text-yellow-600" : "text-gray-400"
                    }`}
                  >
                    &#128737;
                  </span>
                )}
              </div>

              <p className="text-sm font-medium truncate">{badge.name}</p>
              <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                {badge.description}
              </p>

              {isEarned && (
                <p className="text-xs text-green-600 mt-2">
                  Earned {new Date(earnedAt).toLocaleDateString()}
                </p>
              )}

              <span className="inline-block mt-2 text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                {badge.category}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BadgeGallery;
