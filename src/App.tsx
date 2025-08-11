import { HashRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Toaster } from '@/components/ui/toaster';
import { Terminal, Lightbulb, Settings, Users, BookOpen } from 'lucide-react';
import { TourProvider } from '@/context/TourContext';
import { RobotProvider } from '@/context/RobotContext';
import RobotAssistant from '@/components/RobotAssistant';
import Badges from '@/components/Badges';

import NonLinearLearning from '@/pages/NonLinearLearning';
import Dungeon from '@/pages/Dungeon';
import PromptEditorPage from '@/pages/PromptEditorPage';
import ArchetypeGenerator from '@/pages/ArchetypeGenerator';
import SettingsPage from '@/pages/SettingsPage';
import LandingPage from '@/pages/LandingPage';
import Animation from '@/pages/Animation';

const navItems = [
	{ path: '/dungeon', name: 'Dungeon Crawler', icon: Terminal, component: Dungeon },
	{ path: '/learning', name: 'Learning Module', icon: BookOpen, component: NonLinearLearning },
	{ path: '/prompts', name: 'Prompt Editor', icon: Lightbulb, component: PromptEditorPage },
        { path: '/archetypes', name: 'Archetypes', icon: Users, component: ArchetypeGenerator },
        { path: '/settings', name: 'Settings', icon: Settings, component: SettingsPage },
];

function App() {
	return (
		<RobotProvider>
			<TourProvider>
				<Router 
					future={{
						v7_startTransition: true,
						v7_relativeSplatPath: true
					}}
				>
					<AppLayout />
				</Router>
			</TourProvider>
		</RobotProvider>
	);
}

const AppLayout = () => {
	const location = useLocation();
	const isAnimation = location.pathname === '/animation';

	return (
		<div className={cn('min-h-screen bg-background text-foreground flex flex-col crt-lines relative', isAnimation && 'p-0')}> 
			{!isAnimation && (
				<header className="border-b border-primary/50 p-2 flex items-center justify-between sticky top-0 z-10 bg-background/80 backdrop-blur-sm">
					<Badges />
				</header>
			)}

			<main className={isAnimation ? 'w-screen h-screen p-0 m-0 flex-grow overflow-hidden' : 'flex-grow p-4 overflow-auto'}>
				<Routes>
					<Route path="/" element={<LandingPage />} />
					{navItems.map((item) => (
						<Route key={item.path} path={item.path} element={<item.component />} />
					))}
					<Route path="/animation" element={<Animation />} />
					<Route path="*" element={<LandingPage />} />
				</Routes>
			</main>

			{!isAnimation && (
				<footer className="border-t border-primary/50 p-2 text-xs text-center text-muted-foreground">
					<p>
						Symbiotic Intellectual Domain Terminal (DIST) - Status: Nominal. Protocol: Jailbroken. Current User: Guest
					</p>
					<p>&copy; 2025 Uncensored Thought Collective. All rights reversed.</p>
				</footer>
			)}
			<RobotAssistant />
			<Toaster />
		</div>
	);
};

export default App;
