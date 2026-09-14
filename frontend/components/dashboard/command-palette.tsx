'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Command } from 'cmdk';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  CheckSquare,
  Calendar,
  BarChart3,
  Sparkles,
  MessageSquare,
  Settings,
  Search,
} from 'lucide-react';
import { useProjects } from '@/hooks/use-projects';
import { useSearch } from '@/hooks/use-search';

const NAV_COMMANDS = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, keywords: 'home overview' },
  { label: 'Projects', href: '/projects', icon: FolderKanban, keywords: 'kanban board' },
  { label: 'Team', href: '/team', icon: Users, keywords: 'invite members' },
  { label: 'My Tasks', href: '/tasks', icon: CheckSquare, keywords: 'todo' },
  { label: 'Calendar', href: '/calendar', icon: Calendar, keywords: 'schedule' },
  { label: 'Analytics', href: '/analytics', icon: BarChart3, keywords: 'charts stats' },
  { label: 'AI Assistant', href: '/assistant', icon: Sparkles, keywords: 'generate ai gemini' },
  { label: 'Team Chat', href: '/chat', icon: MessageSquare, keywords: 'messages' },
  { label: 'Settings', href: '/settings', icon: Settings, keywords: 'preferences' },
];

const groupHeadingClass =
  '[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-muted-foreground';

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const router = useRouter();
  const { data: projects } = useProjects();
  const { data: searchResults, isFetching: isSearching } = useSearch(inputValue);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === 'Escape') {
        setOpen(false);
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const go = (href: string) => {
    router.push(href);
    setOpen(false);
  };

  const isSearchMode = inputValue.trim().length >= 2;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-[100] flex items-start justify-center bg-black/60 pt-[15vh] backdrop-blur-sm"
        >
          <motion.div
            initial={{ opacity: 0, y: -16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 420, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg overflow-hidden rounded-xl border border-atlas-panel-border bg-atlas-panel shadow-2xl"
          >
            <Command shouldFilter={!isSearchMode} className="flex flex-col">
              <div className="flex items-center gap-2 border-b border-atlas-panel-border px-4 py-3">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Command.Input
                  autoFocus
                  value={inputValue}
                  onValueChange={setInputValue}
                  placeholder="Search tasks, projects, or jump to..."
                  className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                />
                <kbd className="rounded border border-atlas-panel-border px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                  ESC
                </kbd>
              </div>

              <Command.List className="max-h-80 overflow-y-auto p-2">
                {isSearchMode && isSearching && (
                  <p className="px-3 py-8 text-center text-xs text-muted-foreground">Searching...</p>
                )}

                {isSearchMode && !isSearching && (
                  <>
                    {(!searchResults ||
                      (searchResults.tasks.length === 0 && searchResults.projects.length === 0)) && (
                      <p className="px-3 py-8 text-center text-xs text-muted-foreground">
                        No results for &quot;{inputValue}&quot;
                      </p>
                    )}

                    {searchResults && searchResults.tasks.length > 0 && (
                      <Command.Group heading="Tasks" className={groupHeadingClass}>
                        {searchResults.tasks.map((task) => (
                          <Command.Item
                            key={task.id}
                            value={task.id}
                            onSelect={() => go(`/projects/${task.project.id}`)}
                            className="flex cursor-pointer items-center gap-2.5 rounded-md px-3 py-2 text-sm text-foreground data-[selected=true]:bg-atlas-violet/15"
                          >
                            <CheckSquare className="h-4 w-4 text-atlas-cyan" />
                            <span className="truncate">{task.title}</span>
                            <span className="ml-auto shrink-0 font-mono text-[10px] text-muted-foreground">
                              {task.project.key}-{task.number}
                            </span>
                          </Command.Item>
                        ))}
                      </Command.Group>
                    )}

                    {searchResults && searchResults.projects.length > 0 && (
                      <Command.Group heading="Projects" className={groupHeadingClass}>
                        {searchResults.projects.map((project) => (
                          <Command.Item
                            key={project.id}
                            value={project.id}
                            onSelect={() => go(`/projects/${project.id}`)}
                            className="flex cursor-pointer items-center gap-2.5 rounded-md px-3 py-2 text-sm text-foreground data-[selected=true]:bg-atlas-violet/15"
                          >
                            <FolderKanban className="h-4 w-4 text-atlas-cyan" />
                            {project.name}
                            <span className="ml-auto font-mono text-[10px] text-muted-foreground">
                              {project.key}
                            </span>
                          </Command.Item>
                        ))}
                      </Command.Group>
                    )}
                  </>
                )}

                {!isSearchMode && (
                  <>
                    <Command.Empty className="px-3 py-8 text-center text-xs text-muted-foreground">
                      No results found.
                    </Command.Empty>

                    <Command.Group heading="Navigate" className={groupHeadingClass}>
                      {NAV_COMMANDS.map(({ label, href, icon: Icon, keywords }) => (
                        <Command.Item
                          key={href}
                          value={`${label} ${keywords}`}
                          onSelect={() => go(href)}
                          className="flex cursor-pointer items-center gap-2.5 rounded-md px-3 py-2 text-sm text-foreground data-[selected=true]:bg-atlas-violet/15"
                        >
                          <Icon className="h-4 w-4 text-muted-foreground" />
                          {label}
                        </Command.Item>
                      ))}
                    </Command.Group>

                    {projects && projects.length > 0 && (
                      <Command.Group heading="Projects" className={groupHeadingClass}>
                        {projects.map((project) => (
                          <Command.Item
                            key={project.id}
                            value={`${project.name} ${project.key}`}
                            onSelect={() => go(`/projects/${project.id}`)}
                            className="flex cursor-pointer items-center gap-2.5 rounded-md px-3 py-2 text-sm text-foreground data-[selected=true]:bg-atlas-violet/15"
                          >
                            <FolderKanban className="h-4 w-4 text-atlas-cyan" />
                            {project.name}
                            <span className="ml-auto font-mono text-[10px] text-muted-foreground">
                              {project.key}
                            </span>
                          </Command.Item>
                        ))}
                      </Command.Group>
                    )}
                  </>
                )}
              </Command.List>
            </Command>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}