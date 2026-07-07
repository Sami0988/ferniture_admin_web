'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useStore';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import { Moon, Sun, User, Bell, Shield } from 'lucide-react';
import { motion } from 'framer-motion';

export default function SettingsPage() {
  const { user } = useAuth();
  const [darkMode, setDarkMode] = useState(false);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted">Manage your account and preferences</p>
      </div>

      {/* Profile */}
      <Card>
        <div className="flex items-center gap-3 mb-4">
          <User className="h-5 w-5 text-muted" />
          <h2 className="text-sm font-semibold text-foreground">Profile</h2>
        </div>
        <div className="space-y-4">
          <Input label="Name" defaultValue={user?.name || ''} readOnly />
          <Input label="Email" defaultValue={user?.email || ''} readOnly />
          <Input label="Role" defaultValue={user?.role?.replace('_', ' ') || ''} readOnly />
        </div>
      </Card>

      {/* Appearance */}
      <Card>
        <div className="flex items-center gap-3 mb-4">
          {darkMode ? <Moon className="h-5 w-5 text-muted" /> : <Sun className="h-5 w-5 text-muted" />}
          <h2 className="text-sm font-semibold text-foreground">Appearance</h2>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-foreground">Dark Mode</p>
            <p className="text-xs text-muted">Toggle between light and dark themes</p>
          </div>
          <button
            onClick={toggleDarkMode}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              darkMode ? 'bg-brand-gold' : 'bg-border'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                darkMode ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </Card>

      {/* Notifications */}
      <Card>
        <div className="flex items-center gap-3 mb-4">
          <Bell className="h-5 w-5 text-muted" />
          <h2 className="text-sm font-semibold text-foreground">Notifications</h2>
        </div>
        <div className="space-y-3">
          {[
            { label: 'Order completion alerts', description: 'Get notified when a project is marked complete', defaultChecked: true },
            { label: 'Overdue order alerts', description: 'Get notified when orders pass their due date', defaultChecked: true },
            { label: 'Payment received', description: 'Get notified when a payment is recorded', defaultChecked: true },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm text-foreground">{item.label}</p>
                <p className="text-xs text-muted">{item.description}</p>
              </div>
              <input
                type="checkbox"
                defaultChecked={item.defaultChecked}
                className="h-4 w-4 rounded border-border text-brand-gold focus:ring-brand-gold/20"
              />
            </div>
          ))}
        </div>
      </Card>

      {/* Security */}
      <Card>
        <div className="flex items-center gap-3 mb-4">
          <Shield className="h-5 w-5 text-muted" />
          <h2 className="text-sm font-semibold text-foreground">Security</h2>
        </div>
        <Button variant="secondary">Change Password</Button>
      </Card>
    </motion.div>
  );
}
