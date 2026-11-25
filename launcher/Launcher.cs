// RE4 Save Editor launcher: starts the editor server with the bundled (or installed) Node.js and shows the editor in its own
// app-style window (Edge/Chrome "--app" mode, no tabs or address bar). Closing that window stops the editor.
// It is a Windows (GUI) program without a console window of its own; problems are shown in an ordinary message box.
// If no Edge/Chrome is found, the editor is opened in the default browser and keeps running (stop it with Task Manager: node.exe).
// Build (no SDK needed):  csc /target:winexe /r:System.Windows.Forms.dll /out:RE4SaveEditor.exe /optimize launcher\Launcher.cs
using System;
using System.Diagnostics;
using System.IO;
using System.Net;
using System.Text.RegularExpressions;
using System.Threading;
using System.Windows.Forms;

static class Launcher
{
    [STAThread]
    static int Main()
    {
        string dir = AppDomain.CurrentDomain.BaseDirectory;
        string server = Path.Combine(dir, "app", "server.js");
        string node = Path.Combine(dir, "runtime", "node.exe");
        if (!File.Exists(server)) return Fail("app/server.js was not found. Extract the whole zip first and run this file from the extracted folder.");
        if (!File.Exists(node)) node = "node"; // fall back to an installed Node.js

        int port = ReadPort(dir);
        string url = "http://127.0.0.1:" + port + "/";
        Process srv = null;
        try
        {
            if (!IsUp(url))
            {
                var psi = new ProcessStartInfo(node, "\"" + server + "\"") { WorkingDirectory = dir, UseShellExecute = false, CreateNoWindow = true };
                psi.EnvironmentVariables["NO_BROWSER"] = "1"; // this launcher opens the window itself
                psi.EnvironmentVariables["EXIT_WITH_WINDOW"] = "1"; // the server stops itself after the window is closed
                srv = Process.Start(psi);
                for (int i = 0; i < 60 && !IsUp(url) && !srv.HasExited; i++) Thread.Sleep(250);
                if (srv.HasExited) return Fail("The editor stopped right after starting (code " + srv.ExitCode + "). Another program may be using port " + port + "; close it or change \"port\" in app/config.json.");
            }
            else
            {
                // something already answers on this port: make sure it is this version of the editor and not an older copy
                string running = RunningVersion(url), mine = OwnVersion(dir);
                if (running != null && mine != null && running != mine)
                    return Fail("Another copy of the editor (version " + running + ") is already running on port " + port + ", this folder is version " + mine + ".\nClose the other editor window and start this file again.");
            }
        }
        catch (Exception e)
        {
            return Fail("Could not start Node.js (" + e.Message + ").\nUse the all-in-one zip (it contains runtime/node.exe) or install Node.js LTS from https://nodejs.org");
        }

        string browser = FindBrowser();
        if (browser != null)
        {
            try
            {
                // an own profile folder keeps this window separate from the normal browser, so we can tell when it is closed
                string prof = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "RE4SaveEditor", "window");
                Process.Start(new ProcessStartInfo(browser, "--app=" + url + " --user-data-dir=\"" + prof + "\" --window-size=1240,900 --no-first-run --no-default-browser-check") { UseShellExecute = false });
                return 0;
            }
            catch { /* fall through to the default browser */ }
        }
        try { Process.Start(new ProcessStartInfo(url) { UseShellExecute = true }); } catch { }
        MessageBox.Show("Edge or Chrome was not found, so the editor was opened in your default browser at " + url + "\n\nIt stops by itself a few seconds after you close that tab.", "RE4 Save Editor", MessageBoxButtons.OK, MessageBoxIcon.Information);
        return 0;
    }

    static int ReadPort(string dir)
    {
        try
        {
            string cfg = Path.Combine(dir, "app", "config.json");
            if (File.Exists(cfg)) { var m = Regex.Match(File.ReadAllText(cfg), "\"port\"\\s*:\\s*(\\d+)"); if (m.Success) return int.Parse(m.Groups[1].Value); }
        }
        catch { }
        return 4784;
    }

    static string RunningVersion(string url)
    {
        try
        {
            var r = (HttpWebRequest)WebRequest.Create(url + "api/config"); r.Timeout = 1500;
            using (var resp = r.GetResponse()) using (var sr = new StreamReader(resp.GetResponseStream()))
            { var m = Regex.Match(sr.ReadToEnd(), "\"version\"\\s*:\\s*\"([^\"]+)\""); return m.Success ? m.Groups[1].Value : null; }
        }
        catch { return null; }
    }

    static string OwnVersion(string dir)
    {
        try
        {
            string pj = Path.Combine(dir, "package.json");
            if (File.Exists(pj)) { var m = Regex.Match(File.ReadAllText(pj), "\"version\"\\s*:\\s*\"([^\"]+)\""); if (m.Success) return m.Groups[1].Value; }
        }
        catch { }
        return null;
    }

    static bool IsUp(string url)
    {
        try { var r = (HttpWebRequest)WebRequest.Create(url + "api/config"); r.Timeout = 700; using (r.GetResponse()) return true; }
        catch { return false; }
    }

    static string FindBrowser()
    {
        string pf86 = Environment.GetEnvironmentVariable("ProgramFiles(x86)") ?? "", pf = Environment.GetEnvironmentVariable("ProgramFiles") ?? "";
        string[] c = {
            Path.Combine(pf86, "Microsoft", "Edge", "Application", "msedge.exe"), Path.Combine(pf, "Microsoft", "Edge", "Application", "msedge.exe"),
            Path.Combine(pf, "Google", "Chrome", "Application", "chrome.exe"), Path.Combine(pf86, "Google", "Chrome", "Application", "chrome.exe") };
        foreach (var p in c) if (File.Exists(p)) return p;
        return null;
    }

    static int Fail(string msg)
    {
        MessageBox.Show(msg, "RE4 Save Editor", MessageBoxButtons.OK, MessageBoxIcon.Error);
        return 1;
    }
}
