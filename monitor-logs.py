"""
Mek Tycoon - Development Server Log Monitor
Monitors npm run dev:all output and creates filtered logs for errors and important events
Automatically generates summary reports every 15 minutes without stopping the server
"""

import sys
import re
from datetime import datetime
import os
import threading
import time

class LogMonitor:
    def __init__(self, summary_interval_minutes=15):
        self.session_start = datetime.now()
        self.summary_interval = summary_interval_minutes * 60  # Convert to seconds

        # Create timestamped session folder
        session_name = self.session_start.strftime('%Y-%m-%d_%H-%M-%S')
        self.session_folder = f"logs/session_{session_name}"
        os.makedirs(self.session_folder, exist_ok=True)

        # File paths
        self.detail_log = f"{self.session_folder}/detailed_events.log"
        self.last_summary_time = self.session_start
        self.summary_counter = 0

        # Counters
        self.error_count = 0
        self.warning_count = 0
        self.snapshot_events = []
        self.critical_errors = []
        self.cron_events = []
        self.database_issues = []

        # Thread lock for safe concurrent access
        self.lock = threading.Lock()

        # Start summary generation thread
        self.running = True
        self.summary_thread = threading.Thread(target=self._auto_summary_generator, daemon=True)
        self.summary_thread.start()

        # Write initial header
        with open(self.detail_log, 'w', encoding='utf-8') as f:
            f.write(f"=== Mek Tycoon Log Monitor Session ===\n")
            f.write(f"Started: {self.session_start.strftime('%Y-%m-%d %H:%M:%S')}\n")
            f.write(f"Auto-Summary Interval: {summary_interval_minutes} minutes\n")
            f.write(f"Session Folder: {self.session_folder}\n")
            f.write(f"{'='*60}\n\n")

        print(f"📁 Session folder: {self.session_folder}")
        print(f"⏱️  Auto-summary every {summary_interval_minutes} minutes")

    def _auto_summary_generator(self):
        """Background thread that generates summaries periodically"""
        while self.running:
            time.sleep(self.summary_interval)
            if self.running:
                self.generate_summary(auto=True)

    def log_event(self, event_type, message, raw_line=None):
        """Log an event to the detailed log file"""
        timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

        with self.lock:
            with open(self.detail_log, 'a', encoding='utf-8') as f:
                f.write(f"[{timestamp}] [{event_type}]\n")
                f.write(f"{message}\n")
                if raw_line:
                    f.write(f"Raw: {raw_line}\n")
                f.write(f"{'-'*60}\n\n")

    def process_line(self, line):
        """Process a single log line and filter for important events"""

        # Skip empty lines
        if not line.strip():
            return

        with self.lock:
            # CRITICAL: Memory/Size Errors
            if "Too many bytes read" in line or "16777216 bytes" in line:
                self.critical_errors.append((datetime.now(), line))
                self.error_count += 1
                self.log_event("CRITICAL ERROR", "16MB Read Limit Exceeded - Snapshot likely failed", line)
                print(f"🚨 CRITICAL: Memory limit error detected!")
                return

            # CRITICAL: Function execution errors
            if "Error:" in line or "error:" in line.lower():
                self.error_count += 1
                self.log_event("ERROR", "Execution error detected", line)
                print(f"❌ ERROR detected")
                return

            # Warnings
            if "warning:" in line.lower() or "warn" in line.lower():
                self.warning_count += 1
                self.log_event("WARNING", "Warning detected", line)
                return

            # Snapshot events (IMPORTANT for monitoring)
            if "triggerSnapshot" in line or "updateMinerAfterSnapshot" in line:
                self.snapshot_events.append((datetime.now(), line))
                self.log_event("SNAPSHOT", "Snapshot operation detected", line)
                print(f"📸 SNAPSHOT: {line.strip()}")
                return

            # Cron job executions
            if "cron" in line.lower() or "interval" in line.lower():
                self.cron_events.append((datetime.now(), line))
                self.log_event("CRON", "Scheduled task execution", line)
                print(f"⏰ CRON: {line.strip()}")
                return

            # Database operations that might indicate issues
            if "failed" in line.lower() or "timeout" in line.lower():
                self.database_issues.append((datetime.now(), line))
                self.error_count += 1
                self.log_event("DATABASE ISSUE", "Database operation issue detected", line)
                print(f"⚠️ DATABASE: {line.strip()}")
                return

    def generate_summary(self, auto=False):
        """Generate a summary report"""
        with self.lock:
            now = datetime.now()
            duration = now - self.session_start
            interval_duration = now - self.last_summary_time

            self.summary_counter += 1
            summary_filename = f"{self.session_folder}/summary_{self.summary_counter:03d}_{now.strftime('%H-%M-%S')}.txt"

            summary = f"""
{'='*60}
=== MONITORING SUMMARY #{self.summary_counter} ===
{'='*60}

Generated: {now.strftime('%Y-%m-%d %H:%M:%S')}
Session Duration: {duration}
Interval Duration: {interval_duration}
{'(Auto-generated)' if auto else '(Manual/Final)'}

STATISTICS (This Interval):
- Errors: {self.error_count}
- Warnings: {self.warning_count}
- Snapshot Events: {len(self.snapshot_events)}
- Cron Events: {len(self.cron_events)}
- Critical Errors: {len(self.critical_errors)}
- Database Issues: {len(self.database_issues)}

"""

            if self.critical_errors:
                summary += "\n🚨 CRITICAL ERRORS:\n"
                for timestamp, err in self.critical_errors:
                    summary += f"  [{timestamp.strftime('%H:%M:%S')}] {err.strip()}\n"

            if self.snapshot_events:
                summary += "\n📸 SNAPSHOT EVENTS:\n"
                for timestamp, event in self.snapshot_events:
                    summary += f"  [{timestamp.strftime('%H:%M:%S')}] {event.strip()}\n"

            if self.cron_events:
                summary += "\n⏰ CRON EVENTS:\n"
                for timestamp, event in self.cron_events:
                    summary += f"  [{timestamp.strftime('%H:%M:%S')}] {event.strip()}\n"

            if self.database_issues:
                summary += "\n⚠️ DATABASE ISSUES:\n"
                for timestamp, issue in self.database_issues:
                    summary += f"  [{timestamp.strftime('%H:%M:%S')}] {issue.strip()}\n"

            summary += "\n" + "="*60 + "\n"

            # Write summary to file
            with open(summary_filename, 'w', encoding='utf-8') as f:
                f.write(summary)

            # Print notification
            print(f"\n📊 Summary #{self.summary_counter} saved: {summary_filename}")

            # Reset interval counters but keep cumulative tracking in lists
            self.last_summary_time = now

            return summary_filename

    def stop(self):
        """Stop the monitoring session"""
        self.running = False
        if self.summary_thread.is_alive():
            self.summary_thread.join(timeout=1)

        # Generate final summary
        final_summary = self.generate_summary(auto=False)
        print(f"\n✅ Final summary: {final_summary}")
        print(f"📁 All logs in: {self.session_folder}")

def main():
    print("🔍 Mek Tycoon Log Monitor Started")
    print("   Monitoring for errors, warnings, and snapshot events...")
    print("   Summaries auto-generate every 15 minutes")
    print("   Press Ctrl+C to stop\n")

    monitor = LogMonitor(summary_interval_minutes=15)

    try:
        # Read from stdin (piped from npm run dev:all)
        for line in sys.stdin:
            monitor.process_line(line)

    except KeyboardInterrupt:
        print("\n\n⏹️  Monitoring stopped by user")

    finally:
        monitor.stop()
        print("\n   Share the session folder with Claude for analysis!")

if __name__ == "__main__":
    main()
