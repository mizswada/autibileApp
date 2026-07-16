import { StyleSheet } from "react-native";

export const paymentTheme = {
  primary: "#4db5ff",
  background: "#E1F5FF",
  text: "#1E293B",
  muted: "#9CA3AF",
  white: "#fff",
};

export const paymentStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: paymentTheme.background,
  },
  stackHeader: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: paymentTheme.primary,
    paddingTop: 70,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  backButton: {
    marginRight: 24,
  },
  stackHeaderTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: paymentTheme.white,
  },
  tabHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 10,
    paddingBottom: 20,
    paddingHorizontal: 18,
  },
  tabHeaderTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: paymentTheme.text,
  },
  headerAction: {
    fontSize: 15,
    fontWeight: "600",
    color: paymentTheme.text,
  },
  content: {
    paddingHorizontal: 18,
    paddingBottom: 100,
  },
  introText: {
    fontSize: 15,
    color: paymentTheme.muted,
    marginBottom: 14,
    textAlign: "center",
    lineHeight: 20,
    fontWeight: "500",
  },
  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  filterChip: {
    backgroundColor: paymentTheme.white,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  filterChipActive: {
    backgroundColor: paymentTheme.primary,
  },
  filterChipText: {
    color: paymentTheme.text,
    fontWeight: "600",
    fontSize: 13,
  },
  filterChipTextActive: {
    color: paymentTheme.white,
  },
  card: {
    backgroundColor: paymentTheme.white,
    borderRadius: 24,
    padding: 16,
    marginBottom: 16,
    shadowColor: paymentTheme.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: paymentTheme.primary,
  },
  cardAmount: {
    fontSize: 16,
    fontWeight: "700",
    color: paymentTheme.text,
  },
  cardDescription: {
    fontSize: 15,
    color: paymentTheme.text,
    fontWeight: "600",
    marginBottom: 6,
  },
  cardMeta: {
    fontSize: 13,
    color: paymentTheme.muted,
    marginBottom: 4,
  },
  statusBadge: {
    alignSelf: "flex-start",
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginTop: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "700",
    color: paymentTheme.white,
  },
  detailSection: {
    backgroundColor: paymentTheme.white,
    borderRadius: 24,
    padding: 18,
    marginBottom: 16,
    shadowColor: paymentTheme.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  detailLabel: {
    fontSize: 13,
    color: paymentTheme.muted,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    color: paymentTheme.text,
    fontWeight: "600",
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: paymentTheme.text,
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: paymentTheme.white,
    borderRadius: 16,
    padding: 14,
    fontSize: 15,
    color: paymentTheme.text,
  },
  methodRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  methodBtn: {
    backgroundColor: paymentTheme.white,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  methodBtnActive: {
    backgroundColor: paymentTheme.primary,
  },
  methodText: {
    color: paymentTheme.text,
    fontWeight: "600",
  },
  methodTextActive: {
    color: paymentTheme.white,
    fontWeight: "700",
  },
  primaryButton: {
    marginTop: 24,
    backgroundColor: paymentTheme.primary,
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: "center",
  },
  primaryButtonText: {
    color: paymentTheme.white,
    fontWeight: "700",
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: paymentTheme.background,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: paymentTheme.muted,
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 18,
    color: paymentTheme.text,
    marginTop: 16,
    fontWeight: "600",
  },
  emptySubtext: {
    fontSize: 14,
    color: paymentTheme.muted,
    marginTop: 8,
    textAlign: "center",
  },
  pendingNote: {
    color: paymentTheme.primary,
    fontSize: 14,
    fontWeight: "600",
    marginTop: 8,
  },
});
