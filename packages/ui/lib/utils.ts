/**
 * @description
 * This file provides utility functions for the frontend application, as configured
 * by Shadcn/ui.
 *
 * Key features:
 * - `cn`: A utility function that combines the functionality of `clsx` and
 *   `tailwind-merge`. It allows for easily constructing conditional and
 *   conflicting class names in a predictable way.
 *
 * @dependencies
 * - `clsx`: A tiny utility for constructing `className` strings conditionally.
 * - `tailwind-merge`: A function to merge multiple Tailwind CSS classes without style conflicts.
 *
 * @notes
 * This utility is fundamental to working with Shadcn/ui components and custom
 * components that require dynamic styling.
 */

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}