//
//  AuthStore.swift
//  App
//
//  ObservableObject singleton managing user authentication state.
//  Auto-creates a default "Athlete" user on first launch (no sign-in screen).
//

import Foundation
import Combine

// MARK: - UserProfile

struct UserProfile: Codable {
    var id: String
    var name: String
    var email: String

    var avatarLetter: String {
        String(name.prefix(1)).uppercased()
    }
}

// MARK: - AuthStore

final class AuthStore: ObservableObject {

    static let shared = AuthStore()

    @Published var user: UserProfile?
    @Published var isSignedIn: Bool = false
    @Published var isLoading: Bool = false

    private let userDefaultsKey = "cf_user"

    private init() {
        load()
    }

    // MARK: - Public Methods

    func signIn(name: String, email: String) {
        isLoading = true
        let newUser = UserProfile(id: UUID().uuidString, name: name, email: email)
        save(user: newUser)
        self.user = newUser
        self.isSignedIn = true
        isLoading = false
    }

    func signOut() {
        UserDefaults.standard.removeObject(forKey: userDefaultsKey)
        user = nil
        isSignedIn = false
    }

    // MARK: - Persistence

    func load() {
        if let data = UserDefaults.standard.data(forKey: userDefaultsKey),
           let decoded = try? JSONDecoder().decode(UserProfile.self, from: data) {
            self.user = decoded
            self.isSignedIn = true
        } else {
            self.user = nil
            self.isSignedIn = false
        }
    }

    private func save(user: UserProfile) {
        if let data = try? JSONEncoder().encode(user) {
            UserDefaults.standard.set(data, forKey: userDefaultsKey)
        }
    }
}
