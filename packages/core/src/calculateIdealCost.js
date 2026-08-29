const MARGINS = [10, 15, 20, 25, 30];

/**
 * Arredonda o Custo Ideal de forma conservadora.
 *
 * O valor exibido nunca pode ficar acima do máximo
 * matematicamente permitido.
 */
function floorCurrency(value) {
  return Math.floor((value + Number.EPSILON) * 100) / 100;
}

function validateNonNegative(name, value) {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${name} deve ser um número maior ou igual a zero.`);
  }
}

/**
 * Calcula o custo máximo de aquisição compatível
 * com cada faixa de margem da KERPTA.
 */
export function calculateIdealCost({
  referencePrice,
  marketplaceCosts = 0,
  freightCost = 0,
  taxPercent = 0,
  otherCosts = 0,
}) {
  validateNonNegative("referencePrice", referencePrice);
  validateNonNegative("marketplaceCosts", marketplaceCosts);
  validateNonNegative("freightCost", freightCost);
  validateNonNegative("taxPercent", taxPercent);
  validateNonNegative("otherCosts", otherCosts);

  const taxAmount = referencePrice * (taxPercent / 100);

  const externalCosts =
    marketplaceCosts +
    freightCost +
    taxAmount +
    otherCosts;

  const exactBreakEven = referencePrice - externalCosts;

  const margins = MARGINS.map((marginPercent) => {
    const marginAmount =
      referencePrice * (marginPercent / 100);

    const exactIdealCost =
      exactBreakEven - marginAmount;

    const idealCost = floorCurrency(exactIdealCost);

    return {
      marginPercent,
      idealCost,
      viable: idealCost >= 0,
    };
  });

  return {
    referencePrice,
    marketplaceCosts,
    freightCost,
    taxPercent,
    taxAmount,
    otherCosts,

    breakEvenCost: floorCurrency(exactBreakEven),

    margins,
  };
}