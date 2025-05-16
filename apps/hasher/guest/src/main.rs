use risc0_zkvm::guest::{env, sha};
use serde::{Deserialize, Serialize};

// Constants for face verification
const DESCRIPTOR_SIZE: usize = 128;  // Face descriptor size from face-api.js
const SIMILARITY_THRESHOLD: f32 = 0.6;  // Threshold for face matching

#[derive(Serialize, Deserialize)]
struct FaceVerificationInput {
    reference_descriptor: Vec<f32>,
    attempt_descriptor: Vec<f32>,
}

#[derive(Serialize, Deserialize)]
struct FaceVerificationOutput {
    is_match: bool,
    similarity_score: f32,
}

// Helper function to calculate cosine similarity between two vectors
fn cosine_similarity(a: &[f32], b: &[f32]) -> f32 {
    if a.len() != b.len() {
        return 0.0;
    }

    let mut dot_product = 0.0;
    let mut norm_a = 0.0;
    let mut norm_b = 0.0;

    for i in 0..a.len() {
        dot_product += a[i] * b[i];
        norm_a += a[i] * a[i];
        norm_b += b[i] * b[i];
    }

    if norm_a == 0.0 || norm_b == 0.0 {
        return 0.0;
    }

    dot_product / (norm_a.sqrt() * norm_b.sqrt())
}

fn main() {
    // Read the input from the host
    let input: FaceVerificationInput = env::read();

    // Validate input sizes
    if input.reference_descriptor.len() != DESCRIPTOR_SIZE || 
       input.attempt_descriptor.len() != DESCRIPTOR_SIZE {
        panic!("Invalid descriptor size");
    }

    // Calculate similarity score
    let similarity = cosine_similarity(
        &input.reference_descriptor,
        &input.attempt_descriptor
    );

    // Determine if the faces match based on threshold
    let is_match = similarity >= SIMILARITY_THRESHOLD;

    // Create the output
    let output = FaceVerificationOutput {
        is_match,
        similarity_score: similarity,
    };

    // Commit the output to the journal
    env::commit(&output);
} 