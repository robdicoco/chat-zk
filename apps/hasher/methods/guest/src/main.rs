use risc0_zkvm::guest::env;
use sha2::{Digest, Sha256};

fn main() {
    // read the input
    let input: String = env::read();

    let mut hasher = Sha256::new();
    hasher.update(input.as_bytes()); // Update the hasher with the input bytes
    let result = hasher.finalize(); // Get the hash digest
    let output = format!("{:x}", result); // Convert the hash digest to a hexadecimal string
    
    // write public output to the journal
    env::commit(&output);
}