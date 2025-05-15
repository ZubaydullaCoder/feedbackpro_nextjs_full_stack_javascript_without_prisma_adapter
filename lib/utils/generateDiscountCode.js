import { customAlphabet } from "nanoid";

/**
 * Generates a unique discount code with optional prefix
 * @param {number} length - The length of the code (excluding prefix)
 * @param {string} prefix - Optional prefix for the code
 * @returns {string} - The generated discount code
 */
export function generateUniqueDiscountCode(length = 8, prefix = "") {
  // Characters to use for the code (excluding similar-looking characters)
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

  // Create a custom nanoid generator with our alphabet
  const nanoid = customAlphabet(alphabet, length);

  // Generate the code
  const code = nanoid();

  // Add prefix if provided
  return prefix ? `${prefix}${code}` : code;
}

/**
 * Validates if a discount code is unique in the database
 * @param {import('@prisma/client').PrismaClient} prisma - Prisma client instance
 * @param {string} code - The code to validate
 * @returns {Promise<boolean>} - True if the code is unique, false otherwise
 */
export async function isDiscountCodeUnique(prisma, code) {
  const existingCode = await prisma.discountCode.findUnique({
    where: { code },
    select: { id: true },
  });

  return !existingCode;
}

/**
 * Generates a unique discount code that doesn't exist in the database
 * @param {import('@prisma/client').PrismaClient} prisma - Prisma client instance
 * @param {number} length - The length of the code (excluding prefix)
 * @param {string} prefix - Optional prefix for the code
 * @returns {Promise<string>} - A unique discount code
 */
export async function generateVerifiedUniqueDiscountCode(
  prisma,
  length = 8,
  prefix = ""
) {
  // Maximum attempts to find a unique code
  const maxAttempts = 10;
  let attempts = 0;
  let code;
  let isUnique = false;

  // Try to generate a unique code
  while (!isUnique && attempts < maxAttempts) {
    code = generateUniqueDiscountCode(length, prefix);
    isUnique = await isDiscountCodeUnique(prisma, code);
    attempts++;
  }

  // If we couldn't find a unique code after maxAttempts, throw an error
  if (!isUnique) {
    throw new Error(
      "Failed to generate a unique discount code after multiple attempts"
    );
  }

  return code;
}
