use risc0_build::Guest;

fn main() {
    Guest::new().unwrap().compile().unwrap();
} 