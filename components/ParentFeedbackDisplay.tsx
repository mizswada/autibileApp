import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

export function parseParentRating(rate: unknown): number {
  const parsed = Number(rate);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return 0;
  }
  return Math.min(5, Math.max(1, Math.round(parsed)));
}

interface ParentFeedbackDisplayProps {
  rating: unknown;
  comment?: string | null;
  variant?: "full" | "compact";
  emptyMessage?: string;
}

export default function ParentFeedbackDisplay({
  rating,
  comment,
  variant = "full",
  emptyMessage = "No parent rating or review yet.",
}: ParentFeedbackDisplayProps) {
  const parentRating = parseParentRating(rating);
  const review = comment?.trim() || "";
  const hasRating = parentRating > 0;
  const hasReview = review.length > 0;

  if (variant === "compact") {
    if (!hasRating && !hasReview) {
      return null;
    }

    return (
      <View style={styles.compactContainer}>
        {hasRating && (
          <View style={styles.compactStarsRow}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Ionicons
                key={star}
                name={parentRating >= star ? "star" : "star-outline"}
                size={12}
                color={parentRating >= star ? "#FFD700" : "#ccc"}
              />
            ))}
            <Text style={styles.compactRatingText}>{parentRating}/5</Text>
          </View>
        )}
        {hasReview && (
          <Text style={styles.compactReview} numberOfLines={2}>
            "{review}"
          </Text>
        )}
      </View>
    );
  }

  return (
    <View style={styles.fullSection}>
      <Text style={styles.fullTitle}>Parent Rating & Review</Text>

      {hasRating ? (
        <>
          <View style={styles.fullStarsRow}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Ionicons
                key={star}
                name={parentRating >= star ? "star" : "star-outline"}
                size={20}
                color={parentRating >= star ? "#FFD700" : "#ccc"}
              />
            ))}
          </View>
          <Text style={styles.fullRatingText}>{parentRating} out of 5 stars</Text>
        </>
      ) : (
        <Text style={styles.emptyText}>No rating submitted yet.</Text>
      )}

      {hasReview ? (
        <View style={styles.reviewBox}>
          <Text style={styles.reviewLabel}>Review</Text>
          <Text style={styles.reviewText}>{review}</Text>
        </View>
      ) : (
        <Text style={styles.emptyText}>No written review yet.</Text>
      )}

      {!hasRating && !hasReview && (
        <Text style={styles.emptyHint}>{emptyMessage}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  fullSection: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  fullTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#222",
    marginBottom: 12,
  },
  fullStarsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 6,
  },
  fullRatingText: {
    fontSize: 13,
    color: "#666",
    fontStyle: "italic",
    marginBottom: 12,
  },
  reviewBox: {
    backgroundColor: "#F8FAFC",
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E8EDF2",
  },
  reviewLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#666",
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  reviewText: {
    fontSize: 14,
    color: "#333",
    lineHeight: 20,
  },
  emptyText: {
    fontSize: 13,
    color: "#888",
    marginBottom: 8,
  },
  emptyHint: {
    fontSize: 12,
    color: "#aaa",
    marginTop: 4,
  },
  compactContainer: {
    marginTop: 6,
  },
  compactStarsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    marginBottom: 4,
  },
  compactRatingText: {
    fontSize: 11,
    color: "#666",
    marginLeft: 4,
    fontWeight: "600",
  },
  compactReview: {
    fontSize: 11,
    color: "#666",
    fontStyle: "italic",
    lineHeight: 16,
  },
});
