use risc0_zkvm::guest::env;
use serde::{Deserialize, Serialize};


#[derive(Serialize, Deserialize, Debug)]
pub struct FaceComparisonInput {
    pub enrolled: Vec<u32>,
    pub current: Vec<u32>,
    pub threshold: u32,
}

fn euclidean_distance_squared(a: &[u32], b: &[u32]) -> u64 {
    a.iter()
        .zip(b.iter())
        .map(|(&x, &y)| {
            let diff = if x > y { x - y } else { y - x };
            diff as u64 * diff as u64
        })
        .sum()
}

// fn main() {
//     // TODO: Implement your guest code here

//     // read the input
//     let input: u32 = env::read();

//     // TODO: do something with the input

//     // write public output to the journal
//     env::commit(&input);
// }


fn main() {
    let input: FaceComparisonInput = env::read();
    
    // Ensure vectors are the expected length
    assert_eq!(input.enrolled.len(), 128, "Enrolled face vector must be length 128");
    assert_eq!(input.current.len(), 128, "Current face vector must be length 128");
    
    let dist_sq = euclidean_distance_squared(&input.enrolled, &input.current);
    
    // Ensure distance squared <= threshold
    assert!(dist_sq <= input.threshold as u64, "Face does not match");
    
    env::commit(&true);  // Output result
}