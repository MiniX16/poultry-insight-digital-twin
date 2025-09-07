/**
 * Gompertz growth function for calculating ideal chicken weight based on age in days
 * 
 * The Gompertz function is commonly used to model chicken growth curves.
 * Formula: W(t) = W_inf * exp(-exp(-k * (t - t_i)))
 * 
 * @param days - Age of the chicken in days
 * @param W_inf - Asymptotic weight (maximum weight the chicken can reach) in grams
 * @param k - Growth rate constant
 * @param t_i - Inflection point (age at which growth rate is maximum) in days
 * @returns Ideal weight in grams
 */
export function chicken_weight(
  days: number, 
  W_inf: number = 2500, 
  k: number = 0.07, 
  t_i: number = 25
): number {
  // Gompertz function implementation
  const weight = W_inf * Math.exp(-Math.exp(-k * (days - t_i)));
  
  // Return weight in grams, rounded to nearest gram
  return Math.round(weight);
}

/**
 * Calculate daily weight gain using the Gompertz function
 * 
 * @param days - Current age in days
 * @param W_inf - Asymptotic weight in grams
 * @param k - Growth rate constant
 * @param t_i - Inflection point in days
 * @returns Expected daily weight gain in grams
 */
export function chicken_daily_gain(
  days: number,
  W_inf: number = 2500,
  k: number = 0.07,
  t_i: number = 25
): number {
  const currentWeight = chicken_weight(days, W_inf, k, t_i);
  const previousWeight = chicken_weight(days - 1, W_inf, k, t_i);
  
  return Math.round(currentWeight - previousWeight);
}

/**
 * Get ideal weight for a range of days using Gompertz function
 * 
 * @param startDay - Starting day
 * @param endDay - Ending day  
 * @param W_inf - Asymptotic weight in grams
 * @param k - Growth rate constant
 * @param t_i - Inflection point in days
 * @returns Array of {day, weight} objects
 */
export function chicken_weight_curve(
  startDay: number,
  endDay: number,
  W_inf: number = 2500,
  k: number = 0.07,
  t_i: number = 25
): Array<{day: number, weight: number}> {
  const curve = [];
  for (let day = startDay; day <= endDay; day++) {
    curve.push({
      day,
      weight: chicken_weight(day, W_inf, k, t_i)
    });
  }
  return curve;
}