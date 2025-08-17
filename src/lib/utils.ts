// Utility function for conditional classNames (shadcn/ui standard)
export function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(' ');
}
