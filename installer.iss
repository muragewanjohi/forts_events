; Inno Setup Script for Events POS System
; This creates a Windows installer that bundles Node.js and the application

#define MyAppName "Events POS System"
#define MyAppVersion "1.0.0"
#define MyAppPublisher "Events POS"
#define MyAppURL "http://localhost:3000"
#define MyAppExeName "EventsPOS.exe"

[Setup]
; NOTE: The value of AppId uniquely identifies this application. Do not use the same AppId value in installers for other applications.
AppId={{A1B2C3D4-E5F6-7890-ABCD-EF1234567890}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
AppSupportURL={#MyAppURL}
AppUpdatesURL={#MyAppURL}
DefaultDirName={localappdata}\{#MyAppName}
DefaultGroupName={#MyAppName}
DisableProgramGroupPage=yes
LicenseFile=
InfoBeforeFile=
OutputDir=installer
OutputBaseFilename=EventsPOS-Setup
SetupIconFile=
Compression=lzma
SolidCompression=yes
WizardStyle=modern
PrivilegesRequired=admin

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked
Name: "startmenuicon"; Description: "Create Start Menu shortcut"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked
Name: "autostart"; Description: "Start automatically on Windows startup"; GroupDescription: "Startup Options"; Flags: unchecked

[Files]
; Application files (from package directory)
Source: "package\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs
; Node.js runtime (if bundled)
; Source: "nodejs\*"; DestDir: "{app}\nodejs"; Flags: ignoreversion recursesubdirs createallsubdirs
; NOTE: Don't use "Flags: ignoreversion" on any shared system files

[Icons]
Name: "{group}\{#MyAppName}"; Filename: "{app}\start.bat"; WorkingDir: "{app}"
Name: "{group}\{cm:UninstallProgram,{#MyAppName}}"; Filename: "{uninstallexe}"
Name: "{autodesktop}\{#MyAppName}"; Filename: "{app}\start.bat"; WorkingDir: "{app}"; Tasks: desktopicon
Name: "{userappdata}\Microsoft\Windows\Start Menu\Programs\{#MyAppName}"; Filename: "{app}\start.bat"; WorkingDir: "{app}"; Tasks: startmenuicon

[Run]
Filename: "{app}\start.bat"; Description: "{cm:LaunchProgram,{#StringChange(MyAppName, '&', '&&')}}"; Flags: nowait postinstall skipifsilent; WorkingDir: "{app}"

[Code]
var
  NodePath: String;

procedure InitializeWizard();
begin
  // Check if Node.js is installed
  if not RegQueryStringValue(HKEY_LOCAL_MACHINE, 'SOFTWARE\Node.js', 'InstallPath', NodePath) then
  begin
    if not RegQueryStringValue(HKEY_CURRENT_USER, 'SOFTWARE\Node.js', 'InstallPath', NodePath) then
    begin
      // Node.js not found - show warning
      MsgBox('Node.js is not detected on this system.' + #13#10 + 
             'Please install Node.js from https://nodejs.org/ before continuing.', 
             mbInformation, MB_OK);
    end;
  end;
end;

procedure CurStepChanged(CurStep: TSetupStep);
begin
  // Database initialization is handled by start.bat on first run
  // This is simpler and more reliable than trying to run node during installation
end;

