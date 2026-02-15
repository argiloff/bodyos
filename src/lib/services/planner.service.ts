import { generatePlan, PlannerInput } from "../planner/generatePlan";

export const plannerService = {
  async generate(input: PlannerInput) {
    return generatePlan(input);
  },
};
