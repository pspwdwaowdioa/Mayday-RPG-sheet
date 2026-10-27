
import { useEffect, useMemo, useState } from "react";
import { recipes, resources, type Recipe } from "./data";

type Inventory = Record<string, number>;
type Tab =
  | "Inventory"
  | "Crafting"
  | "Catalogue"
  | "Custom Resources"
  | "Character Sheet";

type AbilityScores = {
  combat: number;
  command: number;
  craft: number;
  compute: number;
  compass: number;
};

type CharacterData = {
  name: string;
  playerName: string;
  profile: string;
  archetype: string;
  resolveTokenUsed: boolean;
  portrait: string;
  attributes: string;
  abilities: string;
  equipmentNotes: string;
  backstory: string;
  goals: string;
  notes: string;
  health: number;
  healthMax: number;
  stamina: number;
  staminaMax: number;
  stress: number;
  abilityScores: AbilityScores;
};

const CHARACTER_STORAGE_KEY = "mayday-character-v1";

const emptyCharacter: CharacterData = {
  name: "",
  playerName: "",
  profile: "",
  archetype: "",
  resolveTokenUsed: false,
  portrait: "",
  attributes: "",
  abilities: "",
  equipmentNotes: "",
  backstory: "",
  goals: "",
  notes: "",
  health: 5,
  healthMax: 5,
  stamina: 5,
  staminaMax: 5,
  stress: 0,
  abilityScores: {
  combat: 1,
  command: 1,
  craft: 1,
  compute: 1,
  compass: 1,
},
};

function loadCharacter(): CharacterData {
  try {
    const saved = localStorage.getItem(CHARACTER_STORAGE_KEY);

    if (saved) {
      const parsed = JSON.parse(saved);

      return {
        ...emptyCharacter,
        ...parsed,
        abilityScores: {
          ...emptyCharacter.abilityScores,
          ...(parsed.abilityScores ?? {}),
        },
      };
    }
  } catch {
    // Start with an empty character if saved data cannot be read.
  }

  return { ...emptyCharacter };
}

const CUSTOM_RECIPES_KEY = "mayday-custom-recipes-v1";

function loadCustomRecipes(): Recipe[] {
  try {
    const saved = localStorage.getItem(CUSTOM_RECIPES_KEY);
    if (!saved) return [];

    const parsed: unknown = JSON.parse(saved);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter(
      (item): item is Recipe =>
        item !== null &&
        typeof item === "object" &&
        typeof item.name === "string" &&
        (item.category === "Component" ||
          item.category === "Equipment") &&
        typeof item.description === "string" &&
        item.ingredients !== null &&
        typeof item.ingredients === "object" &&
        !Array.isArray(item.ingredients) &&
        Object.values(item.ingredients).every(
          (amount) =>
            typeof amount === "number" &&
            Number.isInteger(amount) &&
            amount > 0
        )
    );
  } catch {
    return [];
  }
}

const STORAGE_KEY = "mayday-rpg-inventory-v1";

const initialInventory: Inventory = {
  "Salvage Parts": 0,
  "Compound Fluid": 0,
  "Alloy Plate": 0,
  "Polyfiber": 0,
  "Power Core": 0,
  "Crystal Lens": 0,
};

function loadInventory(): Inventory {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return { ...initialInventory, ...JSON.parse(saved) };
    }
  } catch {
    // Use the starter inventory if saved data cannot be read.
  }
  return { ...initialInventory };
}

export default function App() {
  const [inventory, setInventory] = useState<Inventory>(loadInventory);
  const [tab, setTab] = useState<Tab>("Inventory");
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<"All" | "Component" | "Equipment">(
    "All"
  );
  const [character, setCharacter] =
  useState<CharacterData>(loadCharacter);

  const [customRecipes, setCustomRecipes] =
  useState<Recipe[]>(loadCustomRecipes);

const [customName, setCustomName] = useState("");
const [customCategory, setCustomCategory] =
  useState<"Component" | "Equipment">("Component");
const [customDescription, setCustomDescription] = useState("");
const [customIngredients, setCustomIngredients] = useState(
  "Metal Rod: 1\nAlloy Plate: 1"
);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(inventory));
  }, [inventory]);

  useEffect(() => {
  try {
    localStorage.setItem(
      CHARACTER_STORAGE_KEY,
      JSON.stringify(character)
    );
  } catch {
    setMessage(
      "Could not save character data. The portrait may be too large."
    );
  }
}, [character]);

  useEffect(() => {
  localStorage.setItem(
    CUSTOM_RECIPES_KEY,
    JSON.stringify(customRecipes)
  );
}, [customRecipes]);

const allRecipes = useMemo(
  () => [...recipes, ...customRecipes],
  [customRecipes]
);

  const filteredRecipes = useMemo(() => {
    return allRecipes.filter((recipe) => {
      const matchesSearch = recipe.name
        .toLowerCase()
        .includes(search.toLowerCase());

      const matchesCategory =
        category === "All" || recipe.category === category;

      return matchesSearch && matchesCategory;
    });
  }, [allRecipes, search, category]);

  function changeAbility(
  ability: keyof AbilityScores,
  amount: number
) {
  setCharacter((current) => {
    const scores = current.abilityScores;
    const total = Object.values(scores).reduce(
      (sum, score) => sum + score,
      0
    );

    const score = scores[ability];

    // Every ability must have at least 1 point.
    if (amount < 0 && score <= 1) {
      return current;
    }

    // The five abilities cannot exceed 12 points combined.
    if (amount > 0 && total >= 12) {
      return current;
    }

    return {
      ...current,
      abilityScores: {
        ...scores,
        [ability]: score + amount,
      },
    };
  });
}

  function changeQuantity(item: string, amount: number) {
    setInventory((current) => ({
      ...current,
      [item]: Math.max(0, (current[item] ?? 0) + amount),
    }));
    setMessage("");
  }

  function canCraft(recipe: Recipe) {
    return Object.entries(recipe.ingredients).every(
      ([ingredient, amount]) => (inventory[ingredient] ?? 0) >= amount
    );
  }

function saveCustomRecipe() {
  const name = customName.trim();
  const description = customDescription.trim();

  if (!name) {
    setMessage("Please enter an item name.");
    return;
  }

  const duplicate = allRecipes.some(
    (recipe) => recipe.name.toLowerCase() === name.toLowerCase()
  );

  if (duplicate) {
    setMessage("An item with that name already exists.");
    return;
  }

  const ingredients: Record<string, number> = {};

  for (const line of customIngredients.split("\n")) {
    if (!line.trim()) continue;

    const separator = line.lastIndexOf(":");

    if (separator < 1) {
      setMessage(
        `Invalid ingredient line: "${line}". Use Item Name: quantity.`
      );
      return;
    }

    const ingredient = line.slice(0, separator).trim();
    const amountText = line.slice(separator + 1).trim();
    const amount = Number(amountText);

    if (
      !ingredient ||
      !Number.isInteger(amount) ||
      amount <= 0
    ) {
      setMessage(
        `Invalid ingredient line: "${line}". Quantity must be a positive whole number.`
      );
      return;
    }

    ingredients[ingredient] =
      (ingredients[ingredient] ?? 0) + amount;
  }

  if (Object.keys(ingredients).length === 0) {
    setMessage("Please add at least one ingredient.");
    return;
  }

  const newRecipe: Recipe = {
    name,
    category: customCategory,
    description,
    ingredients,
  };

  setCustomRecipes((current) => [...current, newRecipe]);

  setCustomName("");
  setCustomDescription("");
  setCustomIngredients("Metal Rod: 1\nAlloy Plate: 1");
  setMessage(`Saved custom item: ${name}`);
}

function deleteCustomRecipe(name: string) {
  if (
    !window.confirm(
      `Delete the custom recipe "${name}"? Items already in inventory will remain.`
    )
  ) {
    return;
  }

  setCustomRecipes((current) =>
    current.filter((recipe) => recipe.name !== name)
  );

  setMessage(`Deleted custom recipe: ${name}`);
}

  function craft(itemName: string) {
    const recipe = allRecipes.find(
  (entry) => entry.name === itemName
);
    if (!recipe) return;

    if (!canCraft(recipe)) {
      setMessage(`Not enough materials to craft ${recipe.name}.`);
      return;
    }

    setInventory((current) => {
      const next = { ...current };

      for (const [ingredient, amount] of Object.entries(recipe.ingredients)) {
        next[ingredient] = (next[ingredient] ?? 0) - amount;
      }

      next[recipe.name] = (next[recipe.name] ?? 0) + 1;
      return next;
    });

    setMessage(`Crafted 1 ${recipe.name}.`);
  }

  function exportInventory() {
    const file = new Blob([JSON.stringify(inventory, null, 2)], {
      type: "application/json",
    });

    const url = URL.createObjectURL(file);
    const link = document.createElement("a");
    link.href = url;
    link.download = "mayday-inventory.json";
    link.click();
    URL.revokeObjectURL(url);
  }

  function saveCharacterFile() {
  const fileData = {
    format: "mayday-character",
    version: 1,
    character,
    inventory,
    customRecipes,
  };

  const blob = new Blob(
    [JSON.stringify(fileData, null, 2)],
    { type: "application/json" }
  );

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  const safeName = character.name
    .trim()
    .replace(/[^a-z0-9_-]+/gi, "-") || "Unnamed-Character";

  link.href = url;
  link.download = `${safeName}.mayday.json`;
  link.click();

  URL.revokeObjectURL(url);
  setMessage(`Saved character file: ${safeName}`);
}

function loadCharacterFile(file?: File) {
  if (!file) return;

  const reader = new FileReader();

  reader.onload = () => {
    try {
      const data = JSON.parse(String(reader.result));

      if (
        data?.format !== "mayday-character" ||
        data?.version !== 1 ||
        !data.character ||
        typeof data.character !== "object" ||
        !data.inventory ||
        typeof data.inventory !== "object" ||
        Array.isArray(data.inventory) ||
        !Array.isArray(data.customRecipes) ||
        Object.values(data.inventory).some(
          (amount) =>
            typeof amount !== "number" ||
            !Number.isFinite(amount) ||
            amount < 0
        )
      ) {
        throw new Error("Invalid character file");
      }

      const confirmed = window.confirm(
        "Load this character? Your currently loaded character, inventory, and custom recipes will be replaced."
      );

      if (!confirmed) return;

      setCharacter({
  ...emptyCharacter,
  ...data.character,
  abilityScores: {
    ...emptyCharacter.abilityScores,
    ...(data.character.abilityScores ?? {}),
  },
});

      setInventory(data.inventory);
      setCustomRecipes(data.customRecipes);
      setMessage(
        `Loaded character: ${data.character.name || "Unnamed Character"}`
      );
      setTab("Character Sheet");
    } catch {
      setMessage(
        "Could not load that character file. Please select a valid Mayday character file."
      );
    }
  };

  reader.readAsText(file);
}

  function importInventory(file?: File) {
    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));

        if (
          !parsed ||
          typeof parsed !== "object" ||
          Array.isArray(parsed) ||
          Object.values(parsed).some(
            (value) =>
              typeof value !== "number" ||
              !Number.isFinite(value) ||
              value < 0
          )
        ) {
          throw new Error("Invalid inventory");
        }

        setInventory({ ...initialInventory, ...parsed });
        setMessage("Inventory imported successfully.");
      } catch {
        setMessage("Import failed. Please choose a valid inventory JSON file.");
      }
    };

    reader.readAsText(file);
  }

  function resetInventory() {
    if (!window.confirm("Reset inventory to the starter amounts?")) return;

    setInventory({ ...initialInventory });
    setMessage("Inventory reset.");
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">MAYDAY RPG TOOLKIT</p>
          <h1>Character Toolkit</h1>
          <p className="su">
            Track your character and prepare your equipment.
          </p>
        </div>

        <div className="header-actions">
          <button className="button secondary" onClick={exportInventory}>
            Export
          </button>

          <button
  className="button primary"
  onClick={saveCharacterFile}
>
  Save Character
</button>

<label className="button secondary file-button">
  Load Character
  <input
    type="file"
    accept=".json,application/json"
    onChange={(event) => {
      loadCharacterFile(event.target.files?.[0]);
      event.currentTarget.value = "";
    }}
  />
</label>

          <label className="button secondary file-button">
            Import
            <input
              type="file"
              accept=".json,application/json"
              onChange={(event) => {
                importInventory(event.target.files?.[0]);
                event.currentTarget.value = "";
              }}
            />
          </label>
        </div>
      </header>


      <nav className="tabs" aria-label="Main navigation">
        {(
  ["Inventory", "Crafting", "Catalogue", "Custom Resources", "Character Sheet"] as Tab[]
).map((item) => (
          <button
            key={item}
            className={`tab ${tab === item ? "active" : ""}`}
            onClick={() => {
              setTab(item);
              setMessage("");
            }}
          >
            {item}
          </button>
        ))}
      </nav>

      {message && (
        <div className="notice" role="status">
          {message}
        </div>
      )}

      {tab === "Inventory" && (
        <section className="panel">
        <section className="resource-grid">
        {resources.map((resource) => (
          <article className="resource-card" key={resource}>
            <span className="resource-label">{resource}</span>
            <strong className="resource-count">
              {inventory[resource] ?? 0}
            </strong>
            <div className="quantity-controls">
              <button
                aria-label={`Remove one ${resource}`}
                onClick={() => changeQuantity(resource, -1)}
                disabled={(inventory[resource] ?? 0) <= 0}
              >
                −
              </button>
              <button
                aria-label={`Add one ${resource}`}
                onClick={() => changeQuantity(resource, 1)}
              >
                +
              </button>
            </div>
          </article>
        ))}
      </section>
          <div className="section-heading">
            <div>
              <h2>Current Inventory</h2>
              <p>Everything currently held by your character or group.</p>
            </div>
            <button className="button danger" onClick={resetInventory}>
              Reset
            </button>
          </div>

          {Object.entries(inventory).filter(([, amount]) => amount > 0).length ===
          0 ? (
            <p className="empty-state">Your inventory is empty.</p>
          ) : (
            <div className="inventory-list">
              {Object.entries(inventory)
                .filter(([, amount]) => amount > 0)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([item, amount]) => (
                  <div className="inventory-row" key={item}>
                    <span>{item}</span>
                    <strong>{amount}</strong>
                    <div className="small-controls">
                      <button
                        onClick={() => changeQuantity(item, -1)}
                        aria-label={`Remove one ${item}`}
                      >
                        −
                      </button>
                      <button
                        onClick={() => changeQuantity(item, 1)}
                        aria-label={`Add one ${item}`}
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          )}

          <p className="helper-text">
            Inventory is saved automatically in this browser on this device.
          </p>
        </section>
      )}

      {tab === "Crafting" && (
        <section className="panel">
        <section className="resource-grid">
        {resources.map((resource) => (
          <article className="resource-card" key={resource}>
            <span className="resource-label">{resource}</span>
            <strong className="resource-count">
              {inventory[resource] ?? 0}
            </strong>
            <div className="quantity-controls">
              <button
                aria-label={`Remove one ${resource}`}
                onClick={() => changeQuantity(resource, -1)}
                disabled={(inventory[resource] ?? 0) <= 0}
              >
                −
              </button>
              <button
                aria-label={`Add one ${resource}`}
                onClick={() => changeQuantity(resource, 1)}
              >
                +
              </button>
            </div>
          </article>
        ))}
      </section>
          <div className="section-heading">
            <div>
              <h2>Craft an Item</h2>
              <p>Ingredients are deducted when you craft an item.</p>
            </div>
          </div>

          <RecipeFilters
            search={search}
            setSearch={setSearch}
            category={category}
            setCategory={setCategory}
          />

          <div className="recipe-grid">
            {filteredRecipes.map((recipe) => {
              const available = canCraft(recipe);

              return (
                <article className="recipe-card" key={recipe.name}>
                  <div className="recipe-topline">
                    <span className="category-tag">{recipe.category}</span>
                    <span
                      className={`availability ${
                        available ? "ready" : "missing"
                      }`}
                    >
                      {available ? "Ready to craft" : "Missing materials"}
                    </span>
                  </div>

                  <h3>{recipe.name}</h3>
                  <p className="recipe-description">{recipe.description}</p>

                  <h4>Required ingredients</h4>
                  <ul className="ingredient-list">
                    {Object.entries(recipe.ingredients).map(
                      ([ingredient, amount]) => {
                        const owned = inventory[ingredient] ?? 0;

                        return (
                          <li key={ingredient}>
                            <span>{ingredient}</span>
                            <span
                              className={
                                owned >= amount ? "enough" : "not-enough"
                              }
                            >
                              {owned} / {amount}
                            </span>
                          </li>
                        );
                      }
                    )}
                  </ul>

                  <button
                    className="button primary craft-button"
                    disabled={!available}
                    onClick={() => craft(recipe.name)}
                  >
                    Craft 1 {recipe.name}
                  </button>
                </article>
              );
            })}
          </div>

          {filteredRecipes.length === 0 && (
            <p className="empty-state">No recipes match your search.</p>
          )}
        </section>
      )}

      {tab === "Catalogue" && (
        <section className="panel">
          <div className="section-heading">
            <div>
              <h2>Recipe Catalogue</h2>
              <p>Browse every component and equipment recipe.</p>
            </div>
          </div>

          <RecipeFilters
            search={search}
            setSearch={setSearch}
            category={category}
            setCategory={setCategory}
          />

          <div className="catalogue-list">
            {filteredRecipes.map((recipe) => (
              <article className="catalogue-row" key={recipe.name}>
                <div>
                  <span className="category-tag">{recipe.category}</span>
                  <h3>{recipe.name}</h3>
                  <p>{recipe.description}</p>
                </div>
                <div className="catalogue-ingredients">
                  {Object.entries(recipe.ingredients).map(
                    ([ingredient, amount]) => (
                      <span key={ingredient}>
                        {amount} × {ingredient}
                      </span>
                    )
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

{tab === "Custom Resources" && (
  <section className="panel">
    <div className="section-heading">
      <div>
        <h2>Custom Resources</h2>
        <p>
          Create your own components and equipment without changing
          the built-in recipes.
        </p>
      </div>
    </div>

    <form
      className="custom-recipe-form"
      onSubmit={(event) => {
        event.preventDefault();
        saveCustomRecipe();
      }}
    >
      <label>
        Item name
        <input
          value={customName}
          onChange={(event) => setCustomName(event.target.value)}
          placeholder="e.g. Plasma Pistol"
          required
        />
      </label>

      <label>
        Category
        <select
          value={customCategory}
          onChange={(event) =>
            setCustomCategory(
              event.target.value as "Component" | "Equipment"
            )
          }
        >
          <option value="Component">Component</option>
          <option value="Equipment">Equipment</option>
        </select>
      </label>

      <label>
        Description
        <textarea
          value={customDescription}
          onChange={(event) =>
            setCustomDescription(event.target.value)
          }
          placeholder="Describe what the item does..."
          rows={3}
        />
      </label>

      <label>
        Ingredients (one per line: Item Name: quantity)
        <textarea
          value={customIngredients}
          onChange={(event) =>
            setCustomIngredients(event.target.value)
          }
          placeholder={"Metal Rod: 2\nPower Relay Module: 1"}
          rows={5}
          required
        />
      </label>

      <button className="button primary" type="submit">
        Save Custom Item
      </button>
    </form>

    <div className="section-heading">
      <div>
        <h2>Saved Custom Items</h2>
        <p>
          {customRecipes.length} custom recipe
          {customRecipes.length === 1 ? "" : "s"} saved.
        </p>
      </div>
    </div>

    {customRecipes.length === 0 ? (
      <p className="empty-state">
        No custom items yet. Create your first one above.
      </p>
    ) : (
      <div className="catalogue-list">
        {customRecipes.map((recipe) => (
          <article className="catalogue-row" key={recipe.name}>
            <div>
              <span className="category-tag">
                {recipe.category} · Custom
              </span>
              <h3>{recipe.name}</h3>
              <p>{recipe.description || "No description provided."}</p>
              <div className="catalogue-ingredients">
                {Object.entries(recipe.ingredients).map(
                  ([ingredient, amount]) => (
                    <span key={ingredient}>
                      {amount} × {ingredient}
                    </span>
                  )
                )}
              </div>
            </div>

            <button
              className="button danger"
              type="button"
              onClick={() => deleteCustomRecipe(recipe.name)}
            >
              Delete
            </button>
          </article>
        ))}
      </div>
    )}
  </section>
)}

{tab === "Character Sheet" && (
  <section className="panel character-sheet">
    <div className="section-heading">
      <div>
        <h2>Character Sheet</h2>
        <p>Your character's profile, abilities, and story.</p>
      </div>
    </div>

    <div className="character-profile">
      {character.portrait && (
        <img
          src={character.portrait}
          alt="Character portrait"
          className="character-portrait"
        />
      )}


    <section className="vitals-section">
      <div className="section-heading">
        <div>
          <h2>Vitals</h2>
          <p>Track health, stamina, and accumulated stress.</p>
        </div>
      </div>

      <div className="vitals-grid">
        {/* HEALTH */}
        <article className="vital-card health-card">
          <h3>Health</h3>

          <div className="vital-value">
            <strong>{character.health}</strong>
            <span>/ {character.healthMax}</span>
          </div>

          <div className="vital-controls">
            <button
              type="button"
              aria-label="Decrease health"
              disabled={character.health <= 0}
              onClick={() =>
                setCharacter((current) => ({
                  ...current,
                  health: Math.max(0, current.health - 1),
                }))
              }
            >
              −
            </button>

            <button
              type="button"
              aria-label="Increase health"
              disabled={character.health >= character.healthMax}
              onClick={() =>
                setCharacter((current) => ({
                  ...current,
                  health: Math.min(
                    current.healthMax,
                    current.health + 1
                  ),
                }))
              }
            >
              +
            </button>
          </div>

          <label>
            Maximum Health
            <input
              type="number"
              min="1"
              step="1"
              value={character.healthMax}
              onChange={(event) => {
                const max = Math.max(
                  1,
                  Math.floor(Number(event.target.value) || 1)
                );

                setCharacter((current) => ({
                  ...current,
                  healthMax: max,
                  health: Math.min(current.health, max),
                }));
              }}
            />
          </label>
        </article>

        {/* STAMINA */}
        <article className="vital-card stamina-card">
          <h3>Stamina</h3>

          <div className="vital-value">
            <strong>{character.stamina}</strong>
            <span>/ {character.staminaMax}</span>
          </div>

          <div className="vital-controls">
            <button
              type="button"
              aria-label="Decrease stamina"
              disabled={character.stamina <= 0}
              onClick={() =>
                setCharacter((current) => ({
                  ...current,
                  stamina: Math.max(0, current.stamina - 1),
                }))
              }
            >
              −
            </button>

            <button
              type="button"
              aria-label="Increase stamina"
              disabled={character.stamina >= character.staminaMax}
              onClick={() =>
                setCharacter((current) => ({
                  ...current,
                  stamina: Math.min(
                    current.staminaMax,
                    current.stamina + 1
                  ),
                }))
              }
            >
              +
            </button>
          </div>

          <label>
            Maximum Stamina
            <input
              type="number"
              min="1"
              step="1"
              value={character.staminaMax}
              onChange={(event) => {
                const max = Math.max(
                  1,
                  Math.floor(Number(event.target.value) || 1)
                );

                setCharacter((current) => ({
                  ...current,
                  staminaMax: max,
                  stamina: Math.min(current.stamina, max),
                }));
              }}
            />
          </label>
        </article>

        {/* STRESS */}
        <article className="vital-card stress-card">
          <h3>Stress</h3>

          <div className="vital-value">
            <strong>{character.stress}</strong>
            <span> accumulated</span>
          </div>

          <div className="vital-controls">
            <button
              type="button"
              aria-label="Decrease stress"
              disabled={character.stress <= 0}
              onClick={() =>
                setCharacter((current) => ({
                  ...current,
                  stress: Math.max(0, current.stress - 1),
                }))
              }
            >
              −
            </button>

            <button
              type="button"
              aria-label="Increase stress"
              onClick={() =>
                setCharacter((current) => ({
                  ...current,
                  stress: current.stress + 1,
                }))
              }
            >
              +
            </button>
          </div>

          <p className="helper-text">
            Stress starts at zero and has no maximum.
          </p>
        </article>
      </div>
    </section>


      <label>
        Character portrait
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (!file) return;

            if (file.size > 1_000_000) {
              setMessage(
                "Please choose an image smaller than 1 MB."
              );
              event.target.value = "";
              return;
            }

            const reader = new FileReader();

            reader.onload = () => {
              if (typeof reader.result === "string") {
                setCharacter((current) => ({
                  ...current,
                  portrait: reader.result as string,
                }));
                setMessage("Character portrait updated.");
              }
            };

            reader.readAsDataURL(file);
            event.target.value = "";
          }}
        />
      </label>

      {character.portrait && (
        <button
          className="button secondary"
          type="button"
          onClick={() =>
            setCharacter((current) => ({
              ...current,
              portrait: "",
            }))
          }
        >
          Remove Portrait
        </button>
      )}
    </div>

     <div className="character-fields">
  {(
    [
      ["name", "Character Name"],
      ["playerName", "Player Name"],
      ["profile", "Profile"],
      ["archetype", "Archetype"],
    ] as const
  ).map(([field, label]) => (
    <label key={field}>
      {label}
      <input
        value={character[field]}
        onChange={(event) =>
          setCharacter((current) => ({
            ...current,
            [field]: event.target.value,
          }))
        }
      />
    </label>
  ))}

  <label className="resolve-token-field">
    <span>Resolve Token</span>
    <input
      type="checkbox"
      checked={character.resolveTokenUsed}
      onChange={(event) =>
        setCharacter((current) => ({
          ...current,
          resolveTokenUsed: event.target.checked,
        }))
      }
    />
    <span className="helper-text">
      {character.resolveTokenUsed ? "Used" : "Available"}
    </span>
  </label>
</div>

    <section className="ability-section">
  <div className="section-heading">
    <div>
      <h2>Ability Scores — The Five C's</h2>
      <p>
        Your scores determine how many d10s you can roll
        or reroll for a check.
      </p>
    </div>
  </div>

  {(() => {
    const total = Object.values(
      character.abilityScores
    ).reduce((sum, score) => sum + score, 0);

    const remaining = 12 - total;

    const abilities: {
      key: keyof AbilityScores;
      name: string;
      description: string;
    }[] = [
      {
        key: "combat",
        name: "Combat",
        description:
          "Fighting, strength, carrying weight, and endurance.",
      },
      {
        key: "command",
        name: "Command",
        description:
          "Social confrontations and keeping your composure.",
      },
      {
        key: "craft",
        name: "Craft",
        description:
          "Using tools, operating machinery, and making items.",
      },
      {
        key: "compute",
        name: "Compute",
        description:
          "Computers, terminals, and understanding the unknown.",
      },
      {
        key: "compass",
        name: "Compass",
        description:
          "Improvisation, evasion, dodging, and manoeuvres.",
      },
    ];

    return (
      <>
        <div className="ability-points">
          <div>
            <span className="ability-points-label">
              POINTS ALLOCATED
            </span>
            <strong>{total} / 12</strong>
          </div>

          <div>
            <span className="ability-points-label">
              POINTS REMAINING
            </span>
            <strong>{remaining}</strong>
          </div>

          <div
            className="ability-progress-track"
            role="progressbar"
            aria-label="Ability points allocated"
            aria-valuemin={0}
            aria-valuemax={12}
            aria-valuenow={Math.min(total, 12)}
          >
            <div
              className="ability-progress-fill"
              style={{
                width: `${Math.min(100, (total / 12) * 100)}%`,
              }}
            />
          </div>

          <p>
            {remaining === 0
              ? "All 12 ability points have been allocated."
              : `Allocate ${remaining} more point${
                  remaining === 1 ? "" : "s"
                } to complete your character.`}
          </p>
        </div>

        <div className="ability-grid">
          {abilities.map((ability) => {
            const score =
              character.abilityScores[ability.key];

            return (
              <article
                className="ability-card"
                key={ability.key}
              >
                <h3>{ability.name}</h3>

                <p className="ability-description">
                  {ability.description}
                </p>

                <div
                  className="ability-score"
                  aria-label={`${ability.name} score: ${score}`}
                >
                  {score}
                </div>

                <span className="ability-dice">
                  {score}d10
                </span>

                <div className="ability-controls">
                  <button
                    type="button"
                    aria-label={`Decrease ${ability.name}`}
                    disabled={score <= 1}
                    onClick={() =>
                      changeAbility(ability.key, -1)
                    }
                  >
                    −
                  </button>

                  <span>{score}</span>

                  <button
                    type="button"
                    aria-label={`Increase ${ability.name}`}
                    disabled={remaining <= 0}
                    onClick={() =>
                      changeAbility(ability.key, 1)
                    }
                  >
                    +
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </>
    );
  })()}
</section>

    {(
      [
        ["abilities", "Abilities"],
        ["equipmentNotes", "Equipment and Other Details"],
        ["backstory", "Backstory"],
        ["goals", "Goals and Motivations"],
        ["notes", "Notes and Mission Log"],
      ] as const
    ).map(([field, label]) => (
      <label className="character-text-section" key={field}>
        {label}
        <textarea
          rows={4}
          value={character[field]}
          onChange={(event) =>
            setCharacter((current) => ({
              ...current,
              [field]: event.target.value,
            }))
          }
          placeholder={`Write ${label.toLowerCase()} here...`}
        />
      </label>
    ))}

    <p className="helper-text">
      Character information saves automatically on this computer.
      Use Save Character to create a portable backup file.
    </p>

    <button
      className="button primary"
      onClick={saveCharacterFile}
    >
      Save Character File
    </button>
  </section>
)}

      <footer className="footer">
        <span>MAYDAY RPG</span>
        <span>Local inventory prototype · Version 1.0</span>
      </footer>
    </main>
  );
}

type RecipeFiltersProps = {
  search: string;
  setSearch: (value: string) => void;
  category: "All" | "Component" | "Equipment";
  setCategory: (value: "All" | "Component" | "Equipment") => void;
};

function RecipeFilters({
  search,
  setSearch,
  category,
  setCategory,
}: RecipeFiltersProps) {
  return (
    <div className="filters">
      <input
        type="search"
        placeholder="Search recipes..."
        aria-label="Search recipes"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
      />

      <select
        aria-label="Filter recipe category"
        value={category}
        onChange={(event) =>
          setCategory(
            event.target.value as "All" | "Component" | "Equipment"
          )
        }
      >
        <option value="All">All recipes</option>
        <option value="Component">Components</option>
        <option value="Equipment">Equipment</option>
      </select>
    </div>
  );
}
