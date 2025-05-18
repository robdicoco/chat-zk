use risc0_zkvm::{
    guest::env,
    // sha::{Impl, Sha256},
};
use serde::{Deserialize, Serialize};
// use zerocopy::IntoBytes;
// use json::parse;
// use json_core::Outputs;


#[derive(Serialize, Deserialize, Debug)]
pub struct FaceComparisonInput {
    pub enrolled: Vec<f32>,
    pub current: Vec<f32>,
    pub threshold: f32,
}

fn euclidean_distance_squared(a: &[f32], b: &[f32]) -> f32 {
    a.iter()
        .zip(b.iter())
        .map(|(&x, &y)| {
            let diff = if x > y { x - y } else { y - x };
            diff * diff
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

    // Convert f32 vector to bytes for hashing
    // let enrolled_bytes: Vec<u8> = input.enrolled.iter()
    //     .flat_map(|&x| x.to_le_bytes().to_vec())
    //     .collect();
    // let sha = *Impl::hash_bytes(&enrolled_bytes);
    
    let dist_sq = euclidean_distance_squared(&input.enrolled, &input.current);
    
    // Compare f32 values directly
    assert!(dist_sq <= input.threshold, "Face does not match");

    // let out = Outputs {
    //     data: true,
    //     hash: sha,
    // };
    env::commit(&true);  // Output result
}