import { useRoutePlannerContext } from "../context/RoutePlannerContext";

/**
 * Custom hook providing access to centralized route planner state and actions.
 */
export function useRoutePlanner() {
  return useRoutePlannerContext();
}