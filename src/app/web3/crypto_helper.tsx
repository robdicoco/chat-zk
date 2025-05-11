// src/utils/helper_crypto.tsx
// (Adjust the path based on your project structure)

// ========================================================================
// IMPORTANT WARNING: NODE.JS ENVIRONMENT REQUIRED
// ========================================================================
// This module utilizes the built-in Node.js 'crypto' library.
// It is designed to run exclusively in a Node.js environment
// (e.g., backend server, API routes, SSR/SSG, build tools).
//
// DO NOT attempt to import or execute this function directly in
// client-side browser code, as it will fail. For browser-based
// crypto needs, use the Web Crypto API (`window.crypto.getRandomValues`).
// ========================================================================

import crypto from 'crypto'; 

/**
 * Generates a cryptographically secure random token using Node.js crypto.
 * Intended for use in backend, API routes, SSR/SSG, or build scripts.
 *
 * @param byteLength The desired length of the raw random token in bytes (e.g., 64 for 512 bits).
 * @param encoding The encoding for the output string ('hex', 'base64', 'base64url'). Defaults to 'hex'.
 * @returns A securely generated random token string in the specified encoding.
 * @throws Error if byteLength is not a positive number or if run outside a Node.js environment.
 */
export function generateSecureNodeToken(
    byteLength: number,
    encoding: BufferEncoding = 'hex'
): string {

    // Runtime check for Node.js crypto availability
    if (typeof crypto === 'undefined' || typeof crypto.randomBytes !== 'function') {
        throw new Error(
            'Node.js crypto.randomBytes is not available in this environment. This function requires a Node.js runtime.'
        );
    }

    if (!byteLength || byteLength <= 0) {
        throw new Error('byteLength must be a positive number.');
    }

    try {
        // Generate cryptographically strong pseudo-random data.
        const randomBytes: Buffer = crypto.randomBytes(byteLength);
        // Convert the random bytes (Buffer) to a string using the specified encoding.
        return randomBytes.toString(encoding);
    } catch (error) {
        console.error("Error generating secure token:", error);
        // Re-throw or handle as appropriate for your application
        throw new Error(`Failed to generate secure token: ${error instanceof Error ? error.message : String(error)}`);
    }
}

// --- Example Usage Comment (How you might import and use it elsewhere) ---
/*
// In another Node.js context file (e.g., src/pages/api/myApiRoute.ts in Next.js)

import { generateSecureNodeToken } from '../../utils/helper_crypto'; // Adjust path

// ... inside an API handler or server-side function ...
try {
    const tokenLengthBytes = 64; // 512 bits
    const secureSessionToken = generateSecureNodeToken(tokenLengthBytes, 'base64url');
    console.log('Generated Session Token:', secureSessionToken);
    // Use the token (e.g., set it in a cookie, store it in a database)
} catch (error) {
    console.error('Token generation failed:', error);
    // Handle error appropriately
}

*/

