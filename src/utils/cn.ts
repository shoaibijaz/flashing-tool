// Utility function for conditional classNames (shadcn/ui standard)
export function cn(...inputs: unknown[]) {
    return inputs.filter(Boolean).join(' ');
}
