import prisma from '@/prisma/index';
import rules from '@/config/subscription-rules/index';
import { getSession } from 'next-auth/react';

/**
 * Checks if the current user has permission for a specific feature.
 * This is a server-side function.
 *
 * @param {object} req - The Next.js API request object.
 * @param {string} feature - The feature to check (e.g., 'hasAvatarFeature').
 * @returns {boolean} - True if the user has permission, false otherwise.
 */
export const hasPermission = async (req, feature) => {
  const session = await getSession({ req });

  // Deny if user is not authenticated
  if (!session || !session.user || !session.user.id) {
    return false;
  }

  // Find the user's subscription
  const customerPayment = await prisma.customerPayment.findUnique({
    where: { customerId: session.user.id },
    select: { subscriptionType: true },
  });

  // Default to FREE plan if no subscription record is found
  const subscriptionType = customerPayment?.subscriptionType || 'FREE';

  // Get the rules for the user's subscription type
  const subscriptionRules = rules[subscriptionType];

  // Check if the feature is enabled in the rules
  return subscriptionRules?.[feature] || false;
};
