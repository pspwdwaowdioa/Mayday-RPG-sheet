
export type Recipe = {
  name: string;
  category: "Component" | "Equipment";
  ingredients: Record<string, number>;
  description: string;
};

export const resources = [
  "Salvage Parts",
  "Compound Fluid",
  "Alloy Plate",
  "Polyfiber",
  "Power Core",
  "Crystal Lens",
];

export const recipes: Recipe[] = [
  // Components
  {
    name: "Copper Wire",
    category: "Component",
    ingredients: { "Salvage Parts": 2 },
    description: "Basic conductive wire.",
  },
  {
    name: "Metal Rod",
    category: "Component",
    ingredients: { "Alloy Plate": 2 },
    description: "A sturdy metal rod.",
  },
  {
    name: "Insulating Material",
    category: "Component",
    ingredients: { Polyfiber: 2 },
    description: "Material used to insulate electronics.",
  },
  {
    name: "Connector Cable",
    category: "Component",
    ingredients: {
      "Copper Wire": 2,
      "Insulating Material": 1,
    },
    description: "A cable for connecting components.",
  },
  {
    name: "Energy Cell",
    category: "Component",
    ingredients: {
      "Power Core": 1,
      "Compound Fluid": 1,
    },
    description: "A compact energy storage unit.",
  },
  {
    name: "Optical Sensor",
    category: "Component",
    ingredients: {
      "Crystal Lens": 1,
      "Copper Wire": 1,
    },
    description: "A sensor that detects light and movement.",
  },
  {
    name: "Power Relay Module",
    category: "Component",
    ingredients: {
      "Energy Cell": 1,
      "Copper Wire": 2,
    },
    description: "A module for routing electrical power.",
  },

  // Equipment
  {
    name: "Field Knife",
    category: "Equipment",
    ingredients: {
      "Metal Rod": 1,
      "Alloy Plate": 1,
    },
    description: "A reliable close-combat tool.",
  },
  {
    name: "Saber",
    category: "Equipment",
    ingredients: {
      "Metal Rod": 2,
      "Alloy Plate": 1,
    },
    description: "A balanced bladed weapon.",
  },
  {
    name: "Shotgun",
    category: "Equipment",
    ingredients: {
      "Metal Rod": 2,
      "Power Relay Module": 1,
      "Alloy Plate": 2,
    },
    description: "A powerful close-range firearm.",
  },
  {
    name: "Assault Rifle",
    category: "Equipment",
    ingredients: {
      "Metal Rod": 2,
      "Power Relay Module": 1,
      "Connector Cable": 1,
    },
    description: "A versatile ranged weapon.",
  },
  {
    name: "Combat Armor",
    category: "Equipment",
    ingredients: {
      "Alloy Plate": 3,
      Polyfiber: 2,
      "Power Relay Module": 1,
    },
    description: "Protective armor for dangerous missions.",
  },
];
