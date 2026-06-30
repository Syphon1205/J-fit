const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const appDir = path.join(root, 'ios', 'App', 'App');
const projectPath = path.join(root, 'ios', 'App', 'App.xcodeproj', 'project.pbxproj');
const storyboardPath = path.join(appDir, 'Base.lproj', 'Main.storyboard');
const pluginPath = path.join(appDir, 'TrainerProximityPlugin.swift');
const viewControllerPath = path.join(appDir, 'AppViewController.swift');
const sceneDelegatePath = path.join(appDir, 'SceneDelegate.swift');

const swiftSource = `import Foundation
import Capacitor
import MultipeerConnectivity
import UIKit

@objc(TrainerProximity)
public class TrainerProximity: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "TrainerProximity"
    public let jsName = "TrainerProximity"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "startAdvertising", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "stopAdvertising", returnType: CAPPluginReturnPromise)
    ]

    private let serviceType = "cf-trainer"
    private var peerID: MCPeerID?
    private var session: MCSession?
    private var advertiser: MCNearbyServiceAdvertiser?
    private var payloadData: Data?
    private var pendingStartCall: CAPPluginCall?

    @objc func startAdvertising(_ call: CAPPluginCall) {
        guard let payload = call.getString("payload"), let data = payload.data(using: .utf8) else {
            call.reject("Missing trainer metric payload.")
            return
        }

        advertiser?.stopAdvertisingPeer()
        advertiser = nil
        session?.disconnect()
        session = nil
        pendingStartCall = call

        let displayName = call.getString("displayName") ?? UIDevice.current.name
        let peerID = MCPeerID(displayName: displayName)
        let session = MCSession(peer: peerID, securityIdentity: nil, encryptionPreference: .required)
        let advertiser = MCNearbyServiceAdvertiser(peer: peerID, discoveryInfo: ["role": "athlete"], serviceType: serviceType)

        self.peerID = peerID
        self.session = session
        self.advertiser = advertiser
        self.payloadData = data
        session.delegate = self
        advertiser.delegate = self
        advertiser.startAdvertisingPeer()

        DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) { [weak self, weak call] in
            guard let self = self, let call = call, self.pendingStartCall === call else { return }
            self.pendingStartCall = nil
            call.resolve(["advertising": true, "serviceType": self.serviceType])
        }
    }

    @objc func stopAdvertising(_ call: CAPPluginCall) {
        pendingStartCall = nil
        advertiser?.stopAdvertisingPeer()
        advertiser = nil
        session?.disconnect()
        session = nil
        payloadData = nil
        call.resolve(["advertising": false])
    }
}

extension TrainerProximity: MCNearbyServiceAdvertiserDelegate {
    public func advertiser(_ advertiser: MCNearbyServiceAdvertiser, didNotStartAdvertisingPeer error: Error) {
        let message = error.localizedDescription
        if let pendingStartCall {
            self.pendingStartCall = nil
            pendingStartCall.reject(message)
        } else {
            notifyListeners("trainerProximityError", data: ["message": message])
        }
    }

    public func advertiser(
        _ advertiser: MCNearbyServiceAdvertiser,
        didReceiveInvitationFromPeer peerID: MCPeerID,
        withContext context: Data?,
        invitationHandler: @escaping (Bool, MCSession?) -> Void
    ) {
        invitationHandler(true, session)
        notifyListeners("trainerProximityInvite", data: ["peer": peerID.displayName])
    }
}

extension TrainerProximity: MCSessionDelegate {
    public func session(_ session: MCSession, peer peerID: MCPeerID, didChange state: MCSessionState) {
        switch state {
        case .connected:
            notifyListeners("trainerProximityConnected", data: ["peer": peerID.displayName])
            if let payloadData {
                try? session.send(payloadData, toPeers: [peerID], with: .reliable)
            }
        case .connecting:
            notifyListeners("trainerProximityConnecting", data: ["peer": peerID.displayName])
        case .notConnected:
            notifyListeners("trainerProximityDisconnected", data: ["peer": peerID.displayName])
        @unknown default:
            break
        }
    }

    public func session(_ session: MCSession, didReceive data: Data, fromPeer peerID: MCPeerID) {}
    public func session(_ session: MCSession, didReceive stream: InputStream, withName streamName: String, fromPeer peerID: MCPeerID) {}
    public func session(_ session: MCSession, didStartReceivingResourceWithName resourceName: String, fromPeer peerID: MCPeerID, with progress: Progress) {}
    public func session(_ session: MCSession, didFinishReceivingResourceWithName resourceName: String, fromPeer peerID: MCPeerID, at localURL: URL?, withError error: Error?) {}
}
`;

if (!fs.existsSync(appDir) || !fs.existsSync(projectPath)) {
  console.warn('[patch-trainer-proximity-ios] iOS project not found; skipping.');
  process.exit(0);
}

fs.writeFileSync(pluginPath, swiftSource);
fs.writeFileSync(viewControllerPath, `import Capacitor
import UIKit

class AppViewController: CAPBridgeViewController {
    override func capacitorDidLoad() {
        super.capacitorDidLoad()
        bridge?.registerPluginInstance(TrainerProximity())
    }
}
`);
fs.writeFileSync(sceneDelegatePath, `import Capacitor
import UIKit

@available(iOS 13.0, *)
class SceneDelegate: UIResponder, UIWindowSceneDelegate {
    var window: UIWindow?

    func scene(
        _ scene: UIScene,
        willConnectTo session: UISceneSession,
        options connectionOptions: UIScene.ConnectionOptions
    ) {
        guard let windowScene = scene as? UIWindowScene else { return }

        if window == nil {
            let storyboard = UIStoryboard(name: "Main", bundle: nil)
            let rootViewController = storyboard.instantiateInitialViewController() ?? AppViewController()
            let sceneWindow = UIWindow(windowScene: windowScene)
            sceneWindow.rootViewController = rootViewController
            window = sceneWindow
        }

        window?.makeKeyAndVisible()

        connectionOptions.urlContexts.forEach { context in
            _ = ApplicationDelegateProxy.shared.application(UIApplication.shared, open: context.url, options: [:])
        }

        if let userActivity = connectionOptions.userActivities.first {
            _ = ApplicationDelegateProxy.shared.application(
                UIApplication.shared,
                continue: userActivity,
                restorationHandler: { _ in }
            )
        }
    }

    func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
        URLContexts.forEach { context in
            _ = ApplicationDelegateProxy.shared.application(UIApplication.shared, open: context.url, options: [:])
        }
    }

    func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
        _ = ApplicationDelegateProxy.shared.application(
            UIApplication.shared,
            continue: userActivity,
            restorationHandler: { _ in }
        )
    }
}
`);

if (fs.existsSync(storyboardPath)) {
  let storyboard = fs.readFileSync(storyboardPath, 'utf8');
  storyboard = storyboard.replace(
    'customClass="CAPBridgeViewController" customModule="Capacitor"',
    'customClass="AppViewController" customModule="App" customModuleProvider="target"'
  );
  fs.writeFileSync(storyboardPath, storyboard);
}

const infoPlistPath = path.join(appDir, 'Info.plist');
if (fs.existsSync(infoPlistPath)) {
  let plist = fs.readFileSync(infoPlistPath, 'utf8');
  if (!plist.includes('<key>NSLocalNetworkUsageDescription</key>')) {
    plist = plist.replace(
      '\n\t<key>NSMotionUsageDescription</key>',
      '\n\t<key>NSLocalNetworkUsageDescription</key>\n\t<string>Cunningham Fitness uses the local network to sync athlete metrics with the trainer desktop app when you start Trainer Sync.</string>\n\t<key>NSMotionUsageDescription</key>'
    );
  }
  if (!plist.includes('<key>NSBonjourServices</key>')) {
    plist = plist.replace(
      '\n\t<key>NSCameraUsageDescription</key>',
      '\n\t<key>NSBonjourServices</key>\n\t<array>\n\t\t<string>_cf-trainer._tcp</string>\n\t</array>\n\t<key>NSCameraUsageDescription</key>'
    );
  }
  if (!plist.includes('<key>UIApplicationSceneManifest</key>')) {
    plist = plist.replace(
      '\n\t<key>UILaunchStoryboardName</key>',
      '\n\t<key>UIApplicationSceneManifest</key>\n\t<dict>\n\t\t<key>UIApplicationSupportsMultipleScenes</key>\n\t\t<false/>\n\t\t<key>UISceneConfigurations</key>\n\t\t<dict>\n\t\t\t<key>UIWindowSceneSessionRoleApplication</key>\n\t\t\t<array>\n\t\t\t\t<dict>\n\t\t\t\t\t<key>UISceneConfigurationName</key>\n\t\t\t\t\t<string>Default Configuration</string>\n\t\t\t\t\t<key>UISceneDelegateClassName</key>\n\t\t\t\t\t<string>$(PRODUCT_MODULE_NAME).SceneDelegate</string>\n\t\t\t\t\t<key>UISceneStoryboardFile</key>\n\t\t\t\t\t<string>Main</string>\n\t\t\t\t</dict>\n\t\t\t</array>\n\t\t</dict>\n\t</dict>\n\t<key>UILaunchStoryboardName</key>'
    );
  }
  fs.writeFileSync(infoPlistPath, plist);
}

let project = fs.readFileSync(projectPath, 'utf8');
const fileId = '7C100000CF7A000000000001';
const buildId = '7C100001CF7A000000000001';
const controllerFileId = '7C100002CF7A000000000002';
const controllerBuildId = '7C100003CF7A000000000003';
const sceneFileId = '7C100004CF7A000000000004';
const sceneBuildId = '7C100005CF7A000000000005';

if (!project.includes('TrainerProximityPlugin.swift in Sources')) {
  project = project.replace(
    '504EC3081FED79650016851F /* AppDelegate.swift in Sources */ = {isa = PBXBuildFile; fileRef = 504EC3071FED79650016851F /* AppDelegate.swift */; };',
    `504EC3081FED79650016851F /* AppDelegate.swift in Sources */ = {isa = PBXBuildFile; fileRef = 504EC3071FED79650016851F /* AppDelegate.swift */; };
\t\t${buildId} /* TrainerProximityPlugin.swift in Sources */ = {isa = PBXBuildFile; fileRef = ${fileId} /* TrainerProximityPlugin.swift */; };`
  );
  project = project.replace(
    '504EC3071FED79650016851F /* AppDelegate.swift */ = {isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = AppDelegate.swift; sourceTree = "<group>"; };',
    `504EC3071FED79650016851F /* AppDelegate.swift */ = {isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = AppDelegate.swift; sourceTree = "<group>"; };
\t\t${fileId} /* TrainerProximityPlugin.swift */ = {isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = TrainerProximityPlugin.swift; sourceTree = "<group>"; };`
  );
  project = project.replace(
    '504EC3071FED79650016851F /* AppDelegate.swift */,\n',
    `504EC3071FED79650016851F /* AppDelegate.swift */,\n\t\t\t\t${fileId} /* TrainerProximityPlugin.swift */,\n`
  );
  project = project.replace(
    '504EC3081FED79650016851F /* AppDelegate.swift in Sources */,\n',
    `504EC3081FED79650016851F /* AppDelegate.swift in Sources */,\n\t\t\t\t${buildId} /* TrainerProximityPlugin.swift in Sources */,\n`
  );
  fs.writeFileSync(projectPath, project);
}

if (!project.includes('AppViewController.swift in Sources')) {
  project = project.replace(
    '504EC3081FED79650016851F /* AppDelegate.swift in Sources */ = {isa = PBXBuildFile; fileRef = 504EC3071FED79650016851F /* AppDelegate.swift */; };',
    `504EC3081FED79650016851F /* AppDelegate.swift in Sources */ = {isa = PBXBuildFile; fileRef = 504EC3071FED79650016851F /* AppDelegate.swift */; };
\t\t${controllerBuildId} /* AppViewController.swift in Sources */ = {isa = PBXBuildFile; fileRef = ${controllerFileId} /* AppViewController.swift */; };`
  );
  project = project.replace(
    '504EC3071FED79650016851F /* AppDelegate.swift */ = {isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = AppDelegate.swift; sourceTree = "<group>"; };',
    `504EC3071FED79650016851F /* AppDelegate.swift */ = {isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = AppDelegate.swift; sourceTree = "<group>"; };
\t\t${controllerFileId} /* AppViewController.swift */ = {isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = AppViewController.swift; sourceTree = "<group>"; };`
  );
  project = project.replace(
    '504EC3071FED79650016851F /* AppDelegate.swift */,\n',
    `504EC3071FED79650016851F /* AppDelegate.swift */,\n\t\t\t\t${controllerFileId} /* AppViewController.swift */,\n`
  );
  project = project.replace(
    '504EC3081FED79650016851F /* AppDelegate.swift in Sources */,\n',
    `504EC3081FED79650016851F /* AppDelegate.swift in Sources */,\n\t\t\t\t${controllerBuildId} /* AppViewController.swift in Sources */,\n`
  );
  fs.writeFileSync(projectPath, project);
}

if (!project.includes('SceneDelegate.swift in Sources')) {
  project = project.replace(
    '504EC3081FED79650016851F /* AppDelegate.swift in Sources */ = {isa = PBXBuildFile; fileRef = 504EC3071FED79650016851F /* AppDelegate.swift */; };',
    `504EC3081FED79650016851F /* AppDelegate.swift in Sources */ = {isa = PBXBuildFile; fileRef = 504EC3071FED79650016851F /* AppDelegate.swift */; };
\t\t${sceneBuildId} /* SceneDelegate.swift in Sources */ = {isa = PBXBuildFile; fileRef = ${sceneFileId} /* SceneDelegate.swift */; };`
  );
  project = project.replace(
    '504EC3071FED79650016851F /* AppDelegate.swift */ = {isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = AppDelegate.swift; sourceTree = "<group>"; };',
    `504EC3071FED79650016851F /* AppDelegate.swift */ = {isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = AppDelegate.swift; sourceTree = "<group>"; };
\t\t${sceneFileId} /* SceneDelegate.swift */ = {isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = SceneDelegate.swift; sourceTree = "<group>"; };`
  );
  project = project.replace(
    '504EC3071FED79650016851F /* AppDelegate.swift */,\n',
    `504EC3071FED79650016851F /* AppDelegate.swift */,\n\t\t\t\t${sceneFileId} /* SceneDelegate.swift */,\n`
  );
  project = project.replace(
    '504EC3081FED79650016851F /* AppDelegate.swift in Sources */,\n',
    `504EC3081FED79650016851F /* AppDelegate.swift in Sources */,\n\t\t\t\t${sceneBuildId} /* SceneDelegate.swift in Sources */,\n`
  );
  fs.writeFileSync(projectPath, project);
}

console.log('[patch-trainer-proximity-ios] Trainer proximity plugin is present and registered.');
