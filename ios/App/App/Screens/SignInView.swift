import SwiftUI
import AuthenticationServices

struct SignInView: View {
    @EnvironmentObject private var theme: ThemeStore
    @EnvironmentObject private var auth: AuthStore
    
    @State private var showNamePrompt = false
    @State private var nameInput = ""
    @State private var selectedProvider = ""
    @AppStorage("app_theme_mode") private var themeMode = 0

    var body: some View {
        ZStack {
            AppColors.background.ignoresSafeArea()
            
            VStack(spacing: 0) {
                Spacer()
                
                // Logo & Title
                ZStack {
                    Circle()
                        .fill(theme.primary.opacity(0.15))
                        .frame(width: 120, height: 120)
                    Image(systemName: "bolt.heart.fill")
                        .font(.system(size: 54, weight: .bold))
                        .foregroundColor(theme.primary)
                        .shadow(color: theme.primary.opacity(0.5), radius: 10, x: 0, y: 0)
                }
                .padding(.bottom, 24)
                
                Text("Cunningham Fitness")
                    .font(.system(size: 28, weight: .semibold))
                    .foregroundColor(AppColors.textPrimary)
                    .padding(.bottom, 8)
                
                Text("Your personal tracking companion.")
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundColor(AppColors.textSecondary)
                    .padding(.bottom, 60)
                
                // Auth Buttons
                VStack(spacing: 16) {
                    SignInWithAppleButton(.signIn) { request in
                        request.requestedScopes = [.fullName, .email]
                    } onCompletion: { result in
                        switch result {
                        case .success(let authorization):
                            if let appleIDCredential = authorization.credential as? ASAuthorizationAppleIDCredential {
                                let name = [appleIDCredential.fullName?.givenName, appleIDCredential.fullName?.familyName]
                                    .compactMap { $0 }
                                    .joined(separator: " ")
                                let finalName = name.isEmpty ? "Athlete" : name
                                let email = appleIDCredential.email ?? "apple@jfit.local"
                                auth.signIn(name: finalName, email: email)
                            }
                        case .failure(let error):
                            print("Apple Sign In failed: \(error)")
                        }
                    }
                    .signInWithAppleButtonStyle(themeMode == 1 ? .black : .white)
                    .frame(height: 54)
                    .cornerRadius(12)
                    
                    Button {
                        selectedProvider = "Google"
                        showNamePrompt = true
                    } label: {
                        HStack(spacing: 12) {
                            Image(systemName: "g.circle.fill")
                                .font(.system(size: 20))
                                .foregroundColor(.white)
                            Text("Sign in with Google")
                                .font(.system(size: 17, weight: .semibold))
                                .foregroundColor(.white)
                        }
                        .frame(maxWidth: .infinity, minHeight: 54)
                        .background(Color(red: 0.26, green: 0.52, blue: 0.96)) // Google Blue
                        .cornerRadius(12)
                    }
                }
                .padding(.horizontal, 32)
                
                Spacer()
                
                Text("By continuing, you agree to our Terms and Privacy Policy.")
                    .font(.system(size: 11, weight: .medium))
                    .foregroundColor(AppColors.textSecondary)
                    .multilineTextAlignment(.center)
                    .padding(.bottom, 32)
                    .padding(.horizontal, 40)
            }
        }
        .sheet(isPresented: $showNamePrompt) {
            NavigationView {
                VStack(spacing: 20) {
                    TextField("Your Name", text: $nameInput)
                        .font(.system(size: 17, weight: .semibold))
                        .padding(16)
                        .background(AppColors.surface)
                        .cornerRadius(12)
                    
                    Spacer()
                }
                .padding(24)
                .background(AppColors.background.ignoresSafeArea())
                .navigationTitle("Simulate \(selectedProvider)")
                .navigationBarTitleDisplayMode(.inline)
                .toolbar {
                    ToolbarItem(placement: .navigationBarLeading) {
                        Button("Cancel") { showNamePrompt = false }
                            .foregroundColor(theme.primary)
                    }
                    ToolbarItem(placement: .navigationBarTrailing) {
                        Button("Sign In") {
                            let finalName = nameInput.trimmingCharacters(in: .whitespacesAndNewlines)
                            if !finalName.isEmpty {
                                auth.signIn(name: finalName, email: "user@example.com")
                            } else {
                                auth.signIn(name: "Athlete", email: "user@example.com")
                            }
                        }
                        .foregroundColor(theme.primary)
                        .font(.headline)
                    }
                }
                .preferredColorScheme(.dark)
            }
        }
    }
}
