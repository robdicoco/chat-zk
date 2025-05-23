// These constants represent the RISC-V ELF and the image ID generated by risc0-build.
// The ELF is used for proving and the ID is used for verification.
use methods::{
    HASHER_GUEST_ELF, HASHER_GUEST_ID
};
use risc0_zkvm::{default_prover, ExecutorEnv, Receipt};
use serde::{Deserialize, Serialize};

// Import the guest program's input/output types
use face_verification_guest::{FaceVerificationInput, FaceVerificationOutput};

#[derive(Serialize, Deserialize)]
pub struct FaceVerificationResult {
    pub receipt: Receipt,
    pub output: FaceVerificationOutput,
}

pub fn verify_face(
    reference_descriptor: Vec<f32>,
    attempt_descriptor: Vec<f32>,
) -> Result<FaceVerificationResult, Box<dyn std::error::Error>> {
    // Create the input for the guest program
    let input = FaceVerificationInput {
        reference_descriptor,
        attempt_descriptor,
    };

    // Create the execution environment
    let env = ExecutorEnv::builder()
        .add_input(&input)
        .build()?;

    // Get the prover
    let prover = default_prover();

    // Execute the guest program
    let receipt = prover.prove_elf(env, include_bytes!("../guest/target/riscv32im-risc0-zkvm-elf/release/face-verification-guest"))?;

    // Extract the output from the receipt
    let output: FaceVerificationOutput = receipt.journal.decode()?;

    Ok(FaceVerificationResult { receipt, output })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_face_verification() {
        // Create test descriptors (all zeros for simplicity)
        let reference = vec![0.0; 128];
        let attempt = vec![0.0; 128];

        // Verify the faces
        let result = verify_face(reference, attempt).unwrap();

        // Check the result
        assert!(result.output.is_match);
        assert_eq!(result.output.similarity_score, 1.0);
    }

    #[test]
    fn test_face_verification_different() {
        // Create test descriptors (different values)
        let reference = vec![1.0; 128];
        let attempt = vec![0.0; 128];

        // Verify the faces
        let result = verify_face(reference, attempt).unwrap();

        // Check the result
        assert!(!result.output.is_match);
        assert!(result.output.similarity_score < 0.6);
    }
}

fn main() {
    // Initialize tracing
    tracing_subscriber::fmt()
        .with_env_filter(tracing_subscriber::filter::EnvFilter::from_default_env())
        .init();

    // Example usage
    let reference = vec![0.0; 128];
    let attempt = vec![0.0; 128];

    match verify_face(reference, attempt) {
        Ok(result) => {
            println!("Face verification result:");
            println!("Match: {}", result.output.is_match);
            println!("Similarity score: {}", result.output.similarity_score);
            
            // Save the receipt
            let mut receipt_file = std::fs::File::create("proof.bin").unwrap();
            ciborium::into_writer(&result.receipt, &mut receipt_file).unwrap();
            println!("Proof saved to proof.bin");
        }
        Err(e) => {
            eprintln!("Error during face verification: {}", e);
        }
    }
}
