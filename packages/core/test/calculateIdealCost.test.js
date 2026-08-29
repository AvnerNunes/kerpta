import test from "node:test";
import assert from "node:assert/strict";

import { calculateIdealCost } from "../src/calculateIdealCost.js";

test("calcula corretamente as cinco margens", () => {
  const result = calculateIdealCost({
    referencePrice: 280,
    marketplaceCosts: 40,
    freightCost: 15.99,
    taxPercent: 0,
    otherCosts: 5,
  });

  assert.equal(result.breakEvenCost, 219.01);

  assert.deepEqual(result.margins, [
    {
      marginPercent: 10,
      idealCost: 191.01,
      viable: true,
    },
    {
      marginPercent: 15,
      idealCost: 177.01,
      viable: true,
    },
    {
      marginPercent: 20,
      idealCost: 163.01,
      viable: true,
    },
    {
      marginPercent: 25,
      idealCost: 149.01,
      viable: true,
    },
    {
      marginPercent: 30,
      idealCost: 135.01,
      viable: true,
    },
  ]);
});

test("marca como inviável quando o custo ideal fica negativo", () => {
  const result = calculateIdealCost({
    referencePrice: 100,
    marketplaceCosts: 60,
    freightCost: 30,
    taxPercent: 0,
    otherCosts: 5,
  });

  const margin10 = result.margins.find(
    (item) => item.marginPercent === 10
  );

  assert.equal(margin10.idealCost, -5);
  assert.equal(margin10.viable, false);
});

test("calcula imposto percentual sobre o preço de referência", () => {
  const result = calculateIdealCost({
    referencePrice: 200,
    marketplaceCosts: 20,
    freightCost: 10,
    taxPercent: 5,
    otherCosts: 5,
  });

  assert.equal(result.taxAmount, 10);
  assert.equal(result.breakEvenCost, 155);
});

test("aceita custos iguais a zero", () => {
  const result = calculateIdealCost({
    referencePrice: 100,
    marketplaceCosts: 0,
    freightCost: 0,
    taxPercent: 0,
    otherCosts: 0,
  });

  assert.equal(result.breakEvenCost, 100);
  assert.equal(result.margins[0].idealCost, 90);
  assert.equal(result.margins[4].idealCost, 70);
});

test("rejeita valores negativos de entrada", () => {
  assert.throws(() => {
    calculateIdealCost({
      referencePrice: 100,
      marketplaceCosts: 10,
      freightCost: -1,
      taxPercent: 0,
      otherCosts: 0,
    });
  });
});

test("arredonda custo ideal para baixo sem ultrapassar o limite matemático", () => {
  const result = calculateIdealCost({
    referencePrice: 99.99,
    marketplaceCosts: 10.11,
    freightCost: 7.77,
    taxPercent: 3.33,
    otherCosts: 2.22,
  });

  for (const item of result.margins) {
    const exact =
      result.referencePrice -
      result.marketplaceCosts -
      result.freightCost -
      result.taxAmount -
      result.otherCosts -
      result.referencePrice * (item.marginPercent / 100);

    assert.ok(item.idealCost <= exact);
    assert.ok(exact - item.idealCost < 0.01);
  }
});

test("mantém arredondamento conservador também para resultado negativo", () => {
  const result = calculateIdealCost({
    referencePrice: 10,
    marketplaceCosts: 9.991,
    freightCost: 0,
    taxPercent: 0,
    otherCosts: 0,
  });

  const margin10 = result.margins.find(
    (item) => item.marginPercent === 10
  );

  assert.equal(margin10.idealCost, -1);
  assert.equal(margin10.viable, false);
});