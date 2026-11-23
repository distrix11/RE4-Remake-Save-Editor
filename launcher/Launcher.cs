// RE4 Save Editor launcher: starts the editor server with the bundled (or installed) Node.js and keeps the console open.
// Build (no SDK needed):  csc /target:exe /out:RE4SaveEditor.exe /optimize launcher\Launcher.cs
using System;
using System.Diagnostics;
using System.IO;

static class Launcher
{
    static int Main()
    {
        string dir = AppDomain.CurrentDomain.BaseDirectory;
        string server = Path.Combine(dir, "app", "server.js");
        string node = Path.Combine(dir, "runtime", "node.exe");
        Console.Title = "RE4 Save Editor";
        Console.WriteLine("RE4 Save Editor (unofficial). Close this window to stop the editor.");
        Console.WriteLine();
        if (!File.Exists(server)) return Fail("app/server.js was not found. Extract the whole zip first and run this file from the extracted folder.");
        if (!File.Exists(node)) node = "node"; // fall back to an installed Node.js
        try
        {
            var psi = new ProcessStartInfo(node, "\"" + server + "\"") { WorkingDirectory = dir, UseShellExecute = false };
            using (var p = Process.Start(psi))
            {
                p.WaitForExit();
                if (p.ExitCode != 0) return Fail("The editor stopped with code " + p.ExitCode + ". The message above says why.");
                return 0;
            }
        }
        catch (Exception e)
        {
            return Fail("Could not start Node.js (" + e.Message + ").\nUse the all-in-one zip (it contains runtime/node.exe) or install Node.js LTS from https://nodejs.org");
        }
    }
    static int Fail(string msg)
    {
        Console.WriteLine();
        Console.WriteLine("[ERROR] " + msg);
        Console.WriteLine("Press Enter to close.");
        Console.ReadLine();
        return 1;
    }
}
