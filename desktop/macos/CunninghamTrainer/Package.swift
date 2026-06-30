// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "CunninghamTrainer",
    platforms: [.macOS(.v13)],
    products: [
        .executable(name: "CunninghamTrainer", targets: ["CunninghamTrainerApp"]),
    ],
    targets: [
        .executableTarget(
            name: "CunninghamTrainerApp",
            path: "Sources/CunninghamTrainerApp"
        ),
    ]
)
