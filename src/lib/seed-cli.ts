import { seedIfEmpty } from "./seed";

const result = seedIfEmpty();
console.log(result.seeded ? "Base inicial criada." : "Base já existia.");
