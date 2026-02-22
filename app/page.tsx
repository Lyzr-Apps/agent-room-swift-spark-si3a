'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { callAIAgent } from '@/lib/aiAgent'
import { cn, generateUUID } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { FiPlus, FiSettings, FiUsers, FiSend, FiMessageSquare, FiSearch, FiTrash2, FiArrowLeft, FiChevronDown, FiChevronUp, FiActivity, FiCpu, FiUser, FiHash, FiLock, FiGlobe, FiArchive, FiX, FiZap } from 'react-icons/fi'

// ============================================================
// TYPES
// ============================================================

interface RoomAgent {
  id: string
  name: string
  systemPrompt: string
  personality: string
  temperature: number
  topP: number
  responseLength: string
  trigger: 'mentions' | 'all' | 'proactive'
  frequency: string
  interAgentRules: 'reference' | 'independent'
  color: string
}

interface RoomUser {
  id: string
  name: string
  email: string
  role: 'participant' | 'observer' | 'moderator'
}

interface Message {
  id: string
  content: string
  sender: string
  senderType: 'agent' | 'user'
  agentId?: string
  timestamp: string
  confidence?: number
  tone?: string
  references?: string[]
}

interface Room {
  id: string
  name: string
  description: string
  visibility: 'public' | 'private'
  status: 'active' | 'archived'
  agents: RoomAgent[]
  users: RoomUser[]
  messages: Message[]
  createdAt: string
  lastActivity: string
}

type ViewType = 'dashboard' | 'room-config' | 'discussion'

// ============================================================
// CONSTANTS
// ============================================================

const AGENT_ID = '699aa54eadf9a88c8206a794'

const AGENT_COLORS = [
  'hsl(0, 70%, 55%)',
  'hsl(210, 70%, 55%)',
  'hsl(150, 70%, 45%)',
  'hsl(45, 80%, 50%)',
  'hsl(280, 60%, 55%)',
  'hsl(180, 60%, 45%)',
]

const PERSONALITIES = [
  { value: 'formal', label: 'Formal' },
  { value: 'casual', label: 'Casual' },
  { value: 'provocative', label: 'Provocative' },
  { value: 'supportive', label: 'Supportive' },
  { value: 'analytical', label: 'Analytical' },
  { value: 'creative', label: 'Creative' },
]

const RESPONSE_LENGTHS = [
  { value: 'short', label: 'Short' },
  { value: 'medium', label: 'Medium' },
  { value: 'long', label: 'Long' },
  { value: 'unlimited', label: 'Unlimited' },
]

const FREQUENCIES = [
  { value: 'every', label: 'Every message' },
  { value: 'every-2nd', label: 'Every 2nd message' },
  { value: 'every-3rd', label: 'Every 3rd message' },
  { value: 'cooldown', label: 'Cooldown (30s)' },
]

// ============================================================
// SAMPLE DATA FACTORY
// ============================================================

function createSampleData(): Room[] {
  return [
    {
      id: generateUUID(),
      name: 'Product Strategy Review',
      description: 'Multi-perspective analysis of Q2 product roadmap with research, design, and engineering viewpoints.',
      visibility: 'private',
      status: 'active',
      agents: [
        {
          id: 'agent-ra-1',
          name: 'Research Analyst',
          systemPrompt: 'You are a meticulous research analyst. Provide data-driven insights, cite relevant studies, and challenge assumptions with evidence. Always back claims with references.',
          personality: 'analytical',
          temperature: 0.3,
          topP: 0.9,
          responseLength: 'long',
          trigger: 'all',
          frequency: 'every',
          interAgentRules: 'reference',
          color: AGENT_COLORS[0],
        },
        {
          id: 'agent-cd-1',
          name: 'Creative Director',
          systemPrompt: 'You are an imaginative creative director. Think outside the box, propose bold ideas, and push boundaries. Challenge conventional thinking with fresh perspectives.',
          personality: 'creative',
          temperature: 0.8,
          topP: 0.95,
          responseLength: 'medium',
          trigger: 'all',
          frequency: 'every',
          interAgentRules: 'reference',
          color: AGENT_COLORS[1],
        },
        {
          id: 'agent-da-1',
          name: 'Devils Advocate',
          systemPrompt: 'You challenge every idea presented. Find flaws, risks, and weaknesses. Be constructively critical while maintaining professionalism.',
          personality: 'provocative',
          temperature: 0.6,
          topP: 0.85,
          responseLength: 'medium',
          trigger: 'mentions',
          frequency: 'every',
          interAgentRules: 'reference',
          color: AGENT_COLORS[4],
        },
      ],
      users: [
        { id: 'user-1', name: 'Sarah Chen', email: 'sarah@company.com', role: 'moderator' },
        { id: 'user-2', name: 'Marcus Webb', email: 'marcus@company.com', role: 'participant' },
      ],
      messages: [
        {
          id: 'msg-1',
          content: 'What should our top priority be for the Q2 product roadmap? We need to balance user growth with monetization.',
          sender: 'Sarah Chen',
          senderType: 'user',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
        },
        {
          id: 'msg-2',
          content: 'Based on current market data, **user retention** should take precedence over new user acquisition. Our churn rate of 12% is above industry average (8-10%). I recommend focusing on:\n\n1. **Onboarding optimization** - reduce time-to-value\n2. **Feature discovery** - users only engage with 30% of available features\n3. **Personalization engine** - tailored experiences increase retention by 25%\n\nMonetization will naturally follow improved retention metrics.',
          sender: 'Research Analyst',
          senderType: 'agent',
          agentId: 'agent-ra-1',
          timestamp: new Date(Date.now() - 3500000).toISOString(),
          confidence: 0.87,
          tone: 'analytical',
          references: ['McKinsey Digital Report 2024', 'Internal Analytics Dashboard Q1'],
        },
        {
          id: 'msg-3',
          content: 'I agree retention matters, but what if we flip the script entirely? Instead of fixing churn, let us **make the product so remarkable that users become advocates**. Think about it:\n\n- A **social sharing layer** that turns usage into community\n- **Collaborative workspaces** that create network effects\n- A **creator program** that rewards power users\n\nThe best retention strategy is building something people want to tell others about.',
          sender: 'Creative Director',
          senderType: 'agent',
          agentId: 'agent-cd-1',
          timestamp: new Date(Date.now() - 3400000).toISOString(),
          confidence: 0.72,
          tone: 'creative',
          references: ['Viral Loop Strategy - Andrew Chen'],
        },
      ],
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      lastActivity: new Date(Date.now() - 3400000).toISOString(),
    },
    {
      id: generateUUID(),
      name: 'Tech Architecture Planning',
      description: 'Evaluating microservices migration strategy with security, performance, and cost perspectives.',
      visibility: 'public',
      status: 'active',
      agents: [
        {
          id: 'agent-se-1',
          name: 'Security Expert',
          systemPrompt: 'You are a cybersecurity specialist. Evaluate all proposals through a security lens. Identify vulnerabilities, compliance risks, and recommend security-first approaches.',
          personality: 'formal',
          temperature: 0.2,
          topP: 0.8,
          responseLength: 'long',
          trigger: 'all',
          frequency: 'every',
          interAgentRules: 'independent',
          color: AGENT_COLORS[2],
        },
        {
          id: 'agent-co-1',
          name: 'Cost Optimizer',
          systemPrompt: 'You analyze everything from a cost-efficiency perspective. Provide ROI calculations, budget implications, and cost-saving alternatives.',
          personality: 'analytical',
          temperature: 0.3,
          topP: 0.85,
          responseLength: 'medium',
          trigger: 'all',
          frequency: 'every-2nd',
          interAgentRules: 'reference',
          color: AGENT_COLORS[3],
        },
      ],
      users: [
        { id: 'user-3', name: 'Alex Turner', email: 'alex@company.com', role: 'moderator' },
      ],
      messages: [],
      createdAt: new Date(Date.now() - 172800000).toISOString(),
      lastActivity: new Date(Date.now() - 172800000).toISOString(),
    },
    {
      id: generateUUID(),
      name: 'Marketing Campaign Brainstorm',
      description: 'Open brainstorming session for upcoming product launch campaign with brand and growth agents.',
      visibility: 'public',
      status: 'active',
      agents: [
        {
          id: 'agent-bs-1',
          name: 'Brand Strategist',
          systemPrompt: 'You are a brand strategy expert. Focus on brand positioning, messaging frameworks, and audience resonance. Ensure all ideas align with brand values.',
          personality: 'supportive',
          temperature: 0.5,
          topP: 0.9,
          responseLength: 'medium',
          trigger: 'all',
          frequency: 'every',
          interAgentRules: 'reference',
          color: AGENT_COLORS[5],
        },
      ],
      users: [
        { id: 'user-4', name: 'Jamie Ross', email: 'jamie@company.com', role: 'participant' },
      ],
      messages: [],
      createdAt: new Date(Date.now() - 43200000).toISOString(),
      lastActivity: new Date(Date.now() - 43200000).toISOString(),
    },
  ]
}

// ============================================================
// HELPERS
// ============================================================

function renderMarkdown(text: string) {
  if (!text) return null
  return (
    <div className="space-y-2">
      {text.split('\n').map((line, i) => {
        if (line.startsWith('### ')) return <h4 key={i} className="font-semibold text-sm mt-3 mb-1">{line.slice(4)}</h4>
        if (line.startsWith('## ')) return <h3 key={i} className="font-semibold text-base mt-3 mb-1">{line.slice(3)}</h3>
        if (line.startsWith('# ')) return <h2 key={i} className="font-bold text-lg mt-4 mb-2">{line.slice(2)}</h2>
        if (line.startsWith('- ') || line.startsWith('* ')) return <li key={i} className="ml-4 list-disc text-sm">{formatInline(line.slice(2))}</li>
        if (/^\d+\.\s/.test(line)) return <li key={i} className="ml-4 list-decimal text-sm">{formatInline(line.replace(/^\d+\.\s/, ''))}</li>
        if (!line.trim()) return <div key={i} className="h-1" />
        return <p key={i} className="text-sm">{formatInline(line)}</p>
      })}
    </div>
  )
}

function formatInline(text: string) {
  const parts = text.split(/\*\*(.*?)\*\*/g)
  if (parts.length === 1) return text
  return parts.map((part, i) =>
    i % 2 === 1 ? <strong key={i} className="font-semibold">{part}</strong> : part
  )
}

function formatTime(iso: string): string {
  if (!iso) return ''
  try {
    const d = new Date(iso)
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  } catch {
    return ''
  }
}

function timeAgo(iso: string): string {
  if (!iso) return ''
  try {
    const now = Date.now()
    const then = new Date(iso).getTime()
    const diff = now - then
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'Just now'
    if (mins < 60) return `${mins}m ago`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    return `${days}d ago`
  } catch {
    return ''
  }
}

function getInitial(name: string): string {
  return (name?.charAt(0) ?? 'A').toUpperCase()
}

// ============================================================
// ERROR BOUNDARY
// ============================================================

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false, error: '' }
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
          <div className="text-center p-8 max-w-md">
            <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
            <p className="text-muted-foreground mb-4 text-sm">{this.state.error}</p>
            <button onClick={() => this.setState({ hasError: false, error: '' })} className="px-4 py-2 bg-primary text-primary-foreground text-sm">
              Try again
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

// ============================================================
// SMALL REUSABLE PIECES
// ============================================================

function AgentAvatar({ name, color, size = 'md' }: { name: string; color: string; size?: 'sm' | 'md' | 'lg' }) {
  const cls = size === 'sm' ? 'h-6 w-6 text-xs' : size === 'lg' ? 'h-10 w-10 text-base' : 'h-8 w-8 text-sm'
  return (
    <div className={cn('flex items-center justify-center font-bold text-white flex-shrink-0', cls)} style={{ backgroundColor: color }}>
      {getInitial(name)}
    </div>
  )
}

function UserAvatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' }) {
  const cls = size === 'sm' ? 'h-6 w-6 text-xs' : size === 'lg' ? 'h-10 w-10 text-base' : 'h-8 w-8 text-sm'
  return (
    <div className={cn('flex items-center justify-center font-bold bg-secondary text-secondary-foreground flex-shrink-0', cls)}>
      {getInitial(name)}
    </div>
  )
}

function PersonalityBadge({ personality }: { personality: string }) {
  return <Badge variant="outline" className="text-xs capitalize border-border">{personality}</Badge>
}

function TypingDots({ agentName }: { agentName: string }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="flex gap-1">
        <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
      <span className="text-xs text-muted-foreground tracking-tight">{agentName} is thinking...</span>
    </div>
  )
}

// ============================================================
// DASHBOARD VIEW
// ============================================================

function DashboardView({
  rooms,
  onSelect,
  onCreate,
  onConfigure,
  searchQuery,
  setSearchQuery,
}: {
  rooms: Room[]
  onSelect: (room: Room) => void
  onCreate: () => void
  onConfigure: (room: Room) => void
  searchQuery: string
  setSearchQuery: (q: string) => void
}) {
  const filtered = rooms.filter(
    r => r.name.toLowerCase().includes(searchQuery.toLowerCase()) || r.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="flex-1 overflow-y-auto p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight font-serif">Discussion Rooms</h1>
            <p className="text-sm text-muted-foreground mt-1 tracking-tight leading-relaxed">Manage and enter collaborative AI discussion rooms</p>
          </div>
          <Button onClick={onCreate} className="shadow-none gap-2">
            <FiPlus className="h-4 w-4" />
            Create Room
          </Button>
        </div>

        <div className="relative mb-6">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search rooms..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10 shadow-none" />
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="h-16 w-16 bg-secondary flex items-center justify-center mb-4">
              <FiMessageSquare className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold tracking-tight font-serif mb-2">No rooms yet</h3>
            <p className="text-sm text-muted-foreground tracking-tight leading-relaxed max-w-sm">Create your first discussion room to start collaborative AI conversations with multiple agent perspectives.</p>
            <Button onClick={onCreate} className="shadow-none gap-2 mt-6">
              <FiPlus className="h-4 w-4" />
              Create Your First Room
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(room => (
              <Card key={room.id} className="shadow-none border border-border hover:border-foreground/30 transition-colors cursor-pointer group" onClick={() => onSelect(room)}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base font-bold tracking-tight font-serif truncate">{room.name}</CardTitle>
                      <CardDescription className="text-xs mt-1 tracking-tight leading-relaxed line-clamp-2">{room.description}</CardDescription>
                    </div>
                    <Button variant="ghost" size="sm" className="shadow-none h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => { e.stopPropagation(); onConfigure(room) }}>
                      <FiSettings className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pb-4">
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><FiCpu className="h-3 w-3" />{room.agents.length} agent{room.agents.length !== 1 ? 's' : ''}</span>
                    <span className="flex items-center gap-1"><FiUser className="h-3 w-3" />{room.users.length} user{room.users.length !== 1 ? 's' : ''}</span>
                    <span className="flex items-center gap-1">{room.visibility === 'private' ? <FiLock className="h-3 w-3" /> : <FiGlobe className="h-3 w-3" />}{room.visibility}</span>
                  </div>
                  <Separator className="my-3" />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className={cn('inline-block h-2 w-2 rounded-full', room.status === 'active' ? 'bg-green-500' : 'bg-muted-foreground')} />
                      <span className="text-xs text-muted-foreground capitalize">{room.status}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{timeAgo(room.lastActivity)}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================================
// ROOM CONFIG VIEW
// ============================================================

function RoomConfigView({
  room,
  onBack,
  onSave,
  onLaunch,
}: {
  room: Room
  onBack: () => void
  onSave: (room: Room) => void
  onLaunch: (room: Room) => void
}) {
  const [editRoom, setEditRoom] = useState<Room>(() => ({
    ...room,
    agents: room.agents.map(a => ({ ...a })),
    users: room.users.map(u => ({ ...u })),
  }))
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(editRoom.agents.length > 0 ? editRoom.agents[0].id : null)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'participant' | 'observer' | 'moderator'>('participant')

  const selectedAgent = editRoom.agents.find(a => a.id === selectedAgentId) ?? null

  function updateAgent(agentId: string, updates: Partial<RoomAgent>) {
    setEditRoom(prev => ({
      ...prev,
      agents: prev.agents.map(a => a.id === agentId ? { ...a, ...updates } : a),
    }))
  }

  function addAgent() {
    const colorIdx = editRoom.agents.length % AGENT_COLORS.length
    const newAgent: RoomAgent = {
      id: generateUUID(),
      name: 'New Agent',
      systemPrompt: '',
      personality: 'analytical',
      temperature: 0.5,
      topP: 0.9,
      responseLength: 'medium',
      trigger: 'all',
      frequency: 'every',
      interAgentRules: 'reference',
      color: AGENT_COLORS[colorIdx],
    }
    setEditRoom(prev => ({ ...prev, agents: [...prev.agents, newAgent] }))
    setSelectedAgentId(newAgent.id)
  }

  function removeAgent(agentId: string) {
    setEditRoom(prev => {
      const updated = prev.agents.filter(a => a.id !== agentId)
      return { ...prev, agents: updated }
    })
    if (selectedAgentId === agentId) {
      const remaining = editRoom.agents.filter(a => a.id !== agentId)
      setSelectedAgentId(remaining.length > 0 ? remaining[0].id : null)
    }
  }

  function addUser() {
    if (!inviteEmail.trim()) return
    const newUser: RoomUser = {
      id: generateUUID(),
      name: inviteEmail.split('@')[0],
      email: inviteEmail,
      role: inviteRole,
    }
    setEditRoom(prev => ({ ...prev, users: [...prev.users, newUser] }))
    setInviteEmail('')
  }

  function removeUser(userId: string) {
    setEditRoom(prev => ({ ...prev, users: prev.users.filter(u => u.id !== userId) }))
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 lg:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="sm" onClick={onBack} className="shadow-none gap-1">
            <FiArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <Separator orientation="vertical" className="h-5" />
          <h1 className="text-xl font-bold tracking-tight font-serif">Configure Room</h1>
          <span className="text-sm text-muted-foreground tracking-tight">- {editRoom.name}</span>
        </div>

        <Tabs defaultValue="agents" className="w-full">
          <TabsList className="w-full justify-start bg-secondary">
            <TabsTrigger value="agents" className="gap-1.5"><FiCpu className="h-3.5 w-3.5" />Agents</TabsTrigger>
            <TabsTrigger value="users" className="gap-1.5"><FiUsers className="h-3.5 w-3.5" />Users</TabsTrigger>
            <TabsTrigger value="settings" className="gap-1.5"><FiSettings className="h-3.5 w-3.5" />Settings</TabsTrigger>
          </TabsList>

          {/* AGENTS TAB */}
          <TabsContent value="agents" className="mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-1">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold tracking-tight">Configured Agents</h3>
                  <Button variant="outline" size="sm" onClick={addAgent} className="shadow-none gap-1 h-7 text-xs">
                    <FiPlus className="h-3 w-3" />
                    Add
                  </Button>
                </div>
                <div className="space-y-2">
                  {editRoom.agents.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-8 text-center tracking-tight">No agents configured yet.</p>
                  ) : (
                    editRoom.agents.map(agent => (
                      <div key={agent.id} className={cn('flex items-center gap-3 p-3 border border-border cursor-pointer transition-colors', selectedAgentId === agent.id ? 'bg-secondary border-foreground/30' : 'hover:bg-secondary/50')} onClick={() => setSelectedAgentId(agent.id)}>
                        <AgentAvatar name={agent.name} color={agent.color} size="sm" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium tracking-tight truncate">{agent.name}</p>
                          <PersonalityBadge personality={agent.personality} />
                        </div>
                        <button onClick={e => { e.stopPropagation(); removeAgent(agent.id) }} className="h-6 w-6 flex items-center justify-center hover:bg-destructive/20 transition-colors">
                          <FiTrash2 className="h-3 w-3 text-muted-foreground" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="lg:col-span-2">
                {selectedAgent ? (
                  <Card className="shadow-none border border-border">
                    <CardHeader className="pb-4">
                      <div className="flex items-center gap-3">
                        <AgentAvatar name={selectedAgent.name} color={selectedAgent.color} />
                        <div>
                          <CardTitle className="text-base font-bold tracking-tight font-serif">Agent Configuration</CardTitle>
                          <CardDescription className="text-xs tracking-tight">Configure behavior for {selectedAgent.name}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-5">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium tracking-tight">Agent Name</Label>
                        <Input value={selectedAgent.name} onChange={e => updateAgent(selectedAgent.id, { name: e.target.value })} className="shadow-none" />
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs font-medium tracking-tight">System Prompt</Label>
                          <span className="text-xs text-muted-foreground font-mono">{selectedAgent.systemPrompt.length} chars</span>
                        </div>
                        <Textarea value={selectedAgent.systemPrompt} onChange={e => updateAgent(selectedAgent.id, { systemPrompt: e.target.value })} rows={5} className="shadow-none text-sm" placeholder="Define this agent's behavior, expertise, and response style..." />
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium tracking-tight">Personality / Tone</Label>
                        <Select value={selectedAgent.personality} onValueChange={v => updateAgent(selectedAgent.id, { personality: v })}>
                          <SelectTrigger className="shadow-none"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {PERSONALITIES.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label className="text-xs font-medium tracking-tight">Temperature</Label>
                            <span className="text-xs font-mono text-muted-foreground">{selectedAgent.temperature.toFixed(2)}</span>
                          </div>
                          <Slider value={[selectedAgent.temperature]} onValueChange={v => updateAgent(selectedAgent.id, { temperature: v[0] })} min={0} max={1} step={0.05} />
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label className="text-xs font-medium tracking-tight">Top P</Label>
                            <span className="text-xs font-mono text-muted-foreground">{selectedAgent.topP.toFixed(2)}</span>
                          </div>
                          <Slider value={[selectedAgent.topP]} onValueChange={v => updateAgent(selectedAgent.id, { topP: v[0] })} min={0} max={1} step={0.05} />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium tracking-tight">Response Length</Label>
                        <Select value={selectedAgent.responseLength} onValueChange={v => updateAgent(selectedAgent.id, { responseLength: v })}>
                          <SelectTrigger className="shadow-none"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {RESPONSE_LENGTHS.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs font-medium tracking-tight">Trigger Rules</Label>
                        <RadioGroup value={selectedAgent.trigger} onValueChange={v => updateAgent(selectedAgent.id, { trigger: v as RoomAgent['trigger'] })}>
                          <div className="flex items-center gap-2"><RadioGroupItem value="mentions" id={`t-m-${selectedAgent.id}`} /><Label htmlFor={`t-m-${selectedAgent.id}`} className="text-xs tracking-tight cursor-pointer">@mentions only</Label></div>
                          <div className="flex items-center gap-2"><RadioGroupItem value="all" id={`t-a-${selectedAgent.id}`} /><Label htmlFor={`t-a-${selectedAgent.id}`} className="text-xs tracking-tight cursor-pointer">All messages</Label></div>
                          <div className="flex items-center gap-2"><RadioGroupItem value="proactive" id={`t-p-${selectedAgent.id}`} /><Label htmlFor={`t-p-${selectedAgent.id}`} className="text-xs tracking-tight cursor-pointer">Proactive</Label></div>
                        </RadioGroup>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium tracking-tight">Frequency</Label>
                        <Select value={selectedAgent.frequency} onValueChange={v => updateAgent(selectedAgent.id, { frequency: v })}>
                          <SelectTrigger className="shadow-none"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {FREQUENCIES.map(f => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs font-medium tracking-tight">Inter-Agent Rules</Label>
                        <RadioGroup value={selectedAgent.interAgentRules} onValueChange={v => updateAgent(selectedAgent.id, { interAgentRules: v as RoomAgent['interAgentRules'] })}>
                          <div className="flex items-center gap-2"><RadioGroupItem value="reference" id={`ir-r-${selectedAgent.id}`} /><Label htmlFor={`ir-r-${selectedAgent.id}`} className="text-xs tracking-tight cursor-pointer">Can reference other agents</Label></div>
                          <div className="flex items-center gap-2"><RadioGroupItem value="independent" id={`ir-i-${selectedAgent.id}`} /><Label htmlFor={`ir-i-${selectedAgent.id}`} className="text-xs tracking-tight cursor-pointer">Independent only</Label></div>
                        </RadioGroup>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-border">
                    <FiCpu className="h-8 w-8 text-muted-foreground mb-3" />
                    <p className="text-sm text-muted-foreground tracking-tight">Select an agent to configure or add a new one</p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* USERS TAB */}
          <TabsContent value="users" className="mt-4">
            <Card className="shadow-none border border-border">
              <CardHeader>
                <CardTitle className="text-base font-bold tracking-tight font-serif">Invite Users</CardTitle>
                <CardDescription className="text-xs tracking-tight">Add participants, observers, or moderators to this room</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input placeholder="Email address" type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} className="shadow-none flex-1" />
                  <Select value={inviteRole} onValueChange={v => setInviteRole(v as typeof inviteRole)}>
                    <SelectTrigger className="shadow-none w-36"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="participant">Participant</SelectItem>
                      <SelectItem value="observer">Observer</SelectItem>
                      <SelectItem value="moderator">Moderator</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={addUser} className="shadow-none gap-1" disabled={!inviteEmail.trim()}>
                    <FiPlus className="h-4 w-4" />
                    Invite
                  </Button>
                </div>
                <Separator />
                {editRoom.users.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-6 tracking-tight">No users invited yet</p>
                ) : (
                  <div className="space-y-2">
                    {editRoom.users.map(user => (
                      <div key={user.id} className="flex items-center justify-between p-3 border border-border">
                        <div className="flex items-center gap-3">
                          <UserAvatar name={user.name} size="sm" />
                          <div>
                            <p className="text-sm font-medium tracking-tight">{user.name}</p>
                            <p className="text-xs text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="capitalize text-xs">{user.role}</Badge>
                          <button onClick={() => removeUser(user.id)} className="h-6 w-6 flex items-center justify-center hover:bg-destructive/20 transition-colors">
                            <FiTrash2 className="h-3 w-3 text-muted-foreground" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* SETTINGS TAB */}
          <TabsContent value="settings" className="mt-4">
            <Card className="shadow-none border border-border">
              <CardHeader>
                <CardTitle className="text-base font-bold tracking-tight font-serif">Room Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium tracking-tight">Room Name</Label>
                  <Input value={editRoom.name} onChange={e => setEditRoom(prev => ({ ...prev, name: e.target.value }))} className="shadow-none" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium tracking-tight">Description</Label>
                  <Textarea value={editRoom.description} onChange={e => setEditRoom(prev => ({ ...prev, description: e.target.value }))} rows={3} className="shadow-none text-sm" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium tracking-tight">Visibility</Label>
                  <Select value={editRoom.visibility} onValueChange={v => setEditRoom(prev => ({ ...prev, visibility: v as Room['visibility'] }))}>
                    <SelectTrigger className="shadow-none"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">Public</SelectItem>
                      <SelectItem value="private">Private</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Separator />
                <div className="flex items-center justify-between p-3 border border-border">
                  <div>
                    <p className="text-sm font-medium tracking-tight">Archive Room</p>
                    <p className="text-xs text-muted-foreground tracking-tight">Archived rooms are read-only</p>
                  </div>
                  <Button variant="outline" size="sm" className="shadow-none gap-1 text-xs" onClick={() => setEditRoom(prev => ({ ...prev, status: prev.status === 'active' ? 'archived' : 'active' }))}>
                    <FiArchive className="h-3 w-3" />
                    {editRoom.status === 'active' ? 'Archive' : 'Unarchive'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex items-center justify-end gap-3 mt-6">
          <Button variant="outline" onClick={() => onSave(editRoom)} className="shadow-none">Save Changes</Button>
          <Button onClick={() => onLaunch(editRoom)} className="shadow-none gap-1" style={{ backgroundColor: 'hsl(0, 70%, 55%)', color: 'white' }}>
            <FiZap className="h-4 w-4" />
            Launch Room
          </Button>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// DISCUSSION VIEW
// ============================================================

function DiscussionView({
  rooms,
  selectedRoom,
  setSelectedRoom,
  updateRoom,
  isAdmin,
}: {
  rooms: Room[]
  selectedRoom: Room
  setSelectedRoom: (room: Room) => void
  updateRoom: (updated: Room) => void
  isAdmin: boolean
}) {
  const [messageInput, setMessageInput] = useState('')
  const [typingAgents, setTypingAgents] = useState<string[]>([])
  const [showMentionPopover, setShowMentionPopover] = useState(false)
  const [mentionFilter, setMentionFilter] = useState('')
  const [mentionCursorPos, setMentionCursorPos] = useState(0)
  const [agentDetailId, setAgentDetailId] = useState<string | null>(null)
  const [chatError, setChatError] = useState<string | null>(null)
  const [agentsOpen, setAgentsOpen] = useState(true)
  const [usersOpen, setUsersOpen] = useState(true)
  const [activeAgentId, setActiveAgentId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const roomRef = useRef<Room>(selectedRoom)

  // Keep roomRef in sync
  useEffect(() => {
    roomRef.current = selectedRoom
  }, [selectedRoom])

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [selectedRoom.messages.length, typingAgents.length, scrollToBottom])

  const detailAgent = selectedRoom.agents.find(a => a.id === agentDetailId) ?? null

  function parseMentions(text: string): string[] {
    const matches = text.match(/@([\w]+(?:\s[\w]+)?)/g)
    if (!matches) return []
    return matches.map(m => m.slice(1).trim())
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value
    setMessageInput(val)

    const cursorPos = e.target.selectionStart ?? val.length
    const textBeforeCursor = val.slice(0, cursorPos)
    const atIndex = textBeforeCursor.lastIndexOf('@')

    if (atIndex !== -1 && (atIndex === 0 || textBeforeCursor[atIndex - 1] === ' ')) {
      const filterText = textBeforeCursor.slice(atIndex + 1)
      if (filterText.length < 30) {
        setShowMentionPopover(true)
        setMentionFilter(filterText.toLowerCase())
        setMentionCursorPos(atIndex)
        return
      }
    }
    setShowMentionPopover(false)
    setMentionFilter('')
  }

  function insertMention(agentName: string) {
    const before = messageInput.slice(0, mentionCursorPos)
    const after = messageInput.slice(mentionCursorPos)
    const cleanAfter = after.replace(/@[\w\s]*/, '')
    const newVal = `${before}@${agentName} ${cleanAfter}`
    setMessageInput(newVal)
    setShowMentionPopover(false)
    setMentionFilter('')
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  function filteredMentionAgents(): RoomAgent[] {
    return selectedRoom.agents.filter(a => a.name.toLowerCase().includes(mentionFilter))
  }

  function getRespondingAgents(userMessage: string): RoomAgent[] {
    const mentions = parseMentions(userMessage)
    const result: RoomAgent[] = []

    for (const agent of selectedRoom.agents) {
      const isMentioned = mentions.some(m => agent.name.toLowerCase().startsWith(m.toLowerCase()))
      if (isMentioned) {
        result.push(agent)
      } else if ((agent.trigger === 'all' || agent.trigger === 'proactive') && mentions.length === 0) {
        result.push(agent)
      }
    }
    return result
  }

  function buildContext(): string {
    const recent = selectedRoom.messages.slice(-10)
    return recent.map(m => `[${m.sender}]: ${m.content}`).join('\n')
  }

  async function callRoomAgent(agent: RoomAgent, userMessage: string, context: string) {
    const prompt = `[System Configuration]
Agent Name: ${agent.name}
Personality: ${agent.personality}
Response Style: ${agent.responseLength}
${agent.systemPrompt ? `System Prompt: ${agent.systemPrompt}` : ''}

[Conversation Context]
${context}

[User Message]
${userMessage}

Respond as ${agent.name} with a ${agent.personality} tone. Your agent_name in the response must be "${agent.name}".`

    const sessionId = `room-${selectedRoom.id}-agent-${agent.id}`
    setActiveAgentId(agent.id)

    try {
      const result = await callAIAgent(prompt, AGENT_ID, { session_id: sessionId })
      setActiveAgentId(null)

      if (result.success) {
        const parsed = result?.response?.result
        return {
          content: parsed?.response || result?.response?.message || 'No response generated.',
          agent_name: parsed?.agent_name || agent.name,
          confidence: typeof parsed?.confidence === 'number' ? parsed.confidence : 0,
          tone: parsed?.tone || agent.personality,
          references: Array.isArray(parsed?.references) ? parsed.references : [],
        }
      }
      return null
    } catch {
      setActiveAgentId(null)
      return null
    }
  }

  async function handleSend() {
    const text = messageInput.trim()
    if (!text) return
    setChatError(null)

    const userMsg: Message = {
      id: generateUUID(),
      content: text,
      sender: 'You',
      senderType: 'user',
      timestamp: new Date().toISOString(),
    }

    const updatedWithUser: Room = {
      ...roomRef.current,
      messages: [...roomRef.current.messages, userMsg],
      lastActivity: new Date().toISOString(),
    }
    updateRoom(updatedWithUser)
    roomRef.current = updatedWithUser
    setMessageInput('')

    const responding = getRespondingAgents(text)
    if (responding.length === 0) return

    const context = buildContext()

    for (const agent of responding) {
      setTypingAgents(prev => [...prev, agent.name])

      const response = await callRoomAgent(agent, text, context)

      if (response) {
        const agentMsg: Message = {
          id: generateUUID(),
          content: response.content,
          sender: response.agent_name,
          senderType: 'agent',
          agentId: agent.id,
          timestamp: new Date().toISOString(),
          confidence: response.confidence,
          tone: response.tone,
          references: response.references,
        }

        const updatedWithAgent: Room = {
          ...roomRef.current,
          messages: [...roomRef.current.messages, agentMsg],
          lastActivity: new Date().toISOString(),
        }
        updateRoom(updatedWithAgent)
        roomRef.current = updatedWithAgent
      } else {
        setChatError(`${agent.name} failed to respond. You can try sending the message again.`)
      }

      setTypingAgents(prev => prev.filter(n => n !== agent.name))
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const mentions = parseMentions(messageInput)
  const isTargeted = mentions.length > 0

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Left sidebar: room list */}
      <div className="w-56 border-r border-border flex-shrink-0 flex flex-col bg-card/50 hidden md:flex">
        <div className="p-3 border-b border-border">
          <h3 className="text-xs font-semibold tracking-tight text-muted-foreground uppercase">Rooms</h3>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-0.5">
            {rooms.filter(r => r.status === 'active').map(room => (
              <button key={room.id} onClick={() => setSelectedRoom(room)} className={cn('w-full text-left px-3 py-2.5 text-sm tracking-tight transition-colors', selectedRoom.id === room.id ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50')}>
                <div className="flex items-center gap-2">
                  <FiHash className="h-3.5 w-3.5 flex-shrink-0" />
                  <span className="truncate">{room.name}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 truncate pl-5">{room.agents.length} agents</p>
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Center: chat thread */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="h-14 border-b border-border flex items-center justify-between px-4 flex-shrink-0">
          <div className="flex items-center gap-2">
            <FiHash className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-bold tracking-tight font-serif">{selectedRoom.name}</h2>
            <Badge variant="outline" className="text-xs">{selectedRoom.agents.length} agents</Badge>
          </div>
          {isAdmin && (
            <span className="text-xs text-muted-foreground tracking-tight flex items-center gap-1">
              <FiActivity className="h-3 w-3" />
              {activeAgentId ? 'Agent active' : 'Idle'}
            </span>
          )}
        </div>

        <ScrollArea className="flex-1">
          <div className="p-4 space-y-1">
            {selectedRoom.messages.length === 0 && typingAgents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="h-14 w-14 bg-secondary flex items-center justify-center mb-4">
                  <FiMessageSquare className="h-7 w-7 text-muted-foreground" />
                </div>
                <h3 className="text-sm font-semibold tracking-tight font-serif mb-1">Start the conversation</h3>
                <p className="text-xs text-muted-foreground tracking-tight leading-relaxed max-w-xs">Send a message to begin. Use @mentions to target specific agents or broadcast to all.</p>
              </div>
            ) : (
              <>
                {selectedRoom.messages.map(msg => {
                  const agentColor = msg.senderType === 'agent' ? (selectedRoom.agents.find(a => a.id === msg.agentId)?.color ?? AGENT_COLORS[0]) : undefined
                  return (
                    <div key={msg.id} className={cn('py-3 px-4 transition-colors', msg.senderType === 'agent' ? 'border-l-2 bg-card/50' : '')} style={msg.senderType === 'agent' ? { borderLeftColor: agentColor } : undefined}>
                      <div className="flex items-start gap-3">
                        {msg.senderType === 'agent' ? (
                          <AgentAvatar name={msg.sender} color={agentColor ?? AGENT_COLORS[0]} size="sm" />
                        ) : (
                          <UserAvatar name={msg.sender} size="sm" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={cn('text-sm font-semibold tracking-tight', msg.senderType === 'agent' ? 'font-serif' : '')}>{msg.sender}</span>
                            {msg.senderType === 'agent' && (
                              <Badge variant="outline" className="text-xs h-4 px-1.5 border-border" style={{ borderColor: agentColor, color: agentColor }}>Agent</Badge>
                            )}
                            <span className="text-xs text-muted-foreground">{formatTime(msg.timestamp)}</span>
                          </div>
                          <div className="text-sm leading-relaxed tracking-tight">
                            {renderMarkdown(msg.content)}
                          </div>
                          {msg.senderType === 'agent' && (
                            <div className="flex flex-wrap items-center gap-3 mt-2">
                              {typeof msg.confidence === 'number' && msg.confidence > 0 && (
                                <span className="text-xs text-muted-foreground tracking-tight">Confidence: {(msg.confidence * 100).toFixed(0)}%</span>
                              )}
                              {msg.tone && (
                                <span className="text-xs text-muted-foreground tracking-tight capitalize">Tone: {msg.tone}</span>
                              )}
                              {Array.isArray(msg.references) && msg.references.length > 0 && (
                                <span className="text-xs text-muted-foreground tracking-tight">Refs: {msg.references.join(', ')}</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
                {typingAgents.map(name => <TypingDots key={name} agentName={name} />)}
              </>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {chatError && (
          <div className="mx-4 mb-2 p-2 border border-destructive/50 bg-destructive/10 text-xs tracking-tight flex items-center justify-between" style={{ color: 'hsl(0, 70%, 55%)' }}>
            <span>{chatError}</span>
            <button onClick={() => setChatError(null)} className="ml-2"><FiX className="h-3 w-3" /></button>
          </div>
        )}

        <div className="border-t border-border p-3 flex-shrink-0">
          <div className="relative">
            {showMentionPopover && filteredMentionAgents().length > 0 && (
              <div className="absolute bottom-full left-0 mb-1 w-64 bg-popover border border-border z-50 overflow-hidden">
                {filteredMentionAgents().map(agent => (
                  <button key={agent.id} onClick={() => insertMention(agent.name)} className="w-full text-left px-3 py-2 flex items-center gap-2 hover:bg-secondary transition-colors">
                    <AgentAvatar name={agent.name} color={agent.color} size="sm" />
                    <div>
                      <p className="text-sm font-medium tracking-tight">{agent.name}</p>
                      <p className="text-xs text-muted-foreground capitalize">{agent.personality}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            <div className="flex items-center gap-2">
              {isTargeted && (
                <Badge variant="outline" className="text-xs flex-shrink-0 border-border" style={{ borderColor: 'hsl(0, 70%, 55%)', color: 'hsl(0, 70%, 55%)' }}>
                  @{mentions.join(', @')}
                </Badge>
              )}
              <Input ref={inputRef} value={messageInput} onChange={handleInputChange} onKeyDown={handleKeyDown} placeholder={`Message ${selectedRoom.name}... (type @ to mention)`} className="shadow-none flex-1" />
              <Button onClick={handleSend} disabled={!messageInput.trim() || typingAgents.length > 0} className="shadow-none" size="sm">
                <FiSend className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Right sidebar: participants */}
      <div className="w-60 border-l border-border flex-shrink-0 flex flex-col bg-card/50 hidden lg:flex">
        <div className="p-3 border-b border-border">
          <h3 className="text-xs font-semibold tracking-tight text-muted-foreground uppercase">Participants</h3>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2">
            <Collapsible open={agentsOpen} onOpenChange={setAgentsOpen}>
              <CollapsibleTrigger className="w-full flex items-center justify-between px-2 py-1.5 text-xs font-semibold tracking-tight text-muted-foreground uppercase hover:text-foreground transition-colors">
                <span>Agents ({selectedRoom.agents.length})</span>
                {agentsOpen ? <FiChevronUp className="h-3 w-3" /> : <FiChevronDown className="h-3 w-3" />}
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-0.5 mt-1">
                {selectedRoom.agents.map(agent => (
                  <button key={agent.id} onClick={() => setAgentDetailId(agent.id === agentDetailId ? null : agent.id)} className={cn('w-full text-left px-2 py-2 flex items-center gap-2.5 transition-colors', agentDetailId === agent.id ? 'bg-secondary' : 'hover:bg-secondary/50')}>
                    <AgentAvatar name={agent.name} color={agent.color} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium tracking-tight truncate">{agent.name}</p>
                      <PersonalityBadge personality={agent.personality} />
                    </div>
                    {activeAgentId === agent.id && (
                      <span className="h-2 w-2 rounded-full animate-pulse" style={{ backgroundColor: agent.color }} />
                    )}
                  </button>
                ))}
              </CollapsibleContent>
            </Collapsible>

            <Separator className="my-2" />

            <Collapsible open={usersOpen} onOpenChange={setUsersOpen}>
              <CollapsibleTrigger className="w-full flex items-center justify-between px-2 py-1.5 text-xs font-semibold tracking-tight text-muted-foreground uppercase hover:text-foreground transition-colors">
                <span>Users ({selectedRoom.users.length})</span>
                {usersOpen ? <FiChevronUp className="h-3 w-3" /> : <FiChevronDown className="h-3 w-3" />}
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-0.5 mt-1">
                {selectedRoom.users.map(user => (
                  <div key={user.id} className="px-2 py-2 flex items-center gap-2.5">
                    <UserAvatar name={user.name} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium tracking-tight truncate">{user.name}</p>
                      <Badge variant="outline" className="text-xs h-4 px-1 capitalize">{user.role}</Badge>
                    </div>
                  </div>
                ))}
              </CollapsibleContent>
            </Collapsible>
          </div>
        </ScrollArea>

        {detailAgent && (
          <div className="border-t border-border p-3 space-y-3 bg-card">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold tracking-tight uppercase text-muted-foreground">Agent Detail</h4>
              <button onClick={() => setAgentDetailId(null)} className="h-5 w-5 flex items-center justify-center hover:bg-secondary transition-colors"><FiX className="h-3 w-3" /></button>
            </div>
            <div className="flex items-center gap-2">
              <AgentAvatar name={detailAgent.name} color={detailAgent.color} />
              <div>
                <p className="text-sm font-bold tracking-tight font-serif">{detailAgent.name}</p>
                <PersonalityBadge personality={detailAgent.personality} />
              </div>
            </div>
            <div className="space-y-2 text-xs text-muted-foreground tracking-tight">
              <div><span className="font-medium text-foreground">Prompt: </span>{detailAgent.systemPrompt ? (detailAgent.systemPrompt.length > 120 ? detailAgent.systemPrompt.slice(0, 120) + '...' : detailAgent.systemPrompt) : 'No prompt set'}</div>
              <div><span className="font-medium text-foreground">Trigger: </span><span className="capitalize">{detailAgent.trigger === 'mentions' ? '@mentions only' : detailAgent.trigger}</span></div>
              <div><span className="font-medium text-foreground">Response: </span><span className="capitalize">{detailAgent.responseLength}</span></div>
              <div><span className="font-medium text-foreground">Temp: </span><span className="font-mono">{detailAgent.temperature.toFixed(2)}</span></div>
            </div>
            <Button variant="outline" size="sm" className="w-full shadow-none gap-1 text-xs" onClick={() => { insertMention(detailAgent.name); setAgentDetailId(null) }}>
              <FiSend className="h-3 w-3" />
              Ask {detailAgent.name}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================================
// MAIN PAGE
// ============================================================

export default function Page() {
  const [currentView, setCurrentView] = useState<ViewType>('dashboard')
  const [rooms, setRooms] = useState<Room[]>([])
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null)
  const [isAdmin, setIsAdmin] = useState(true)
  const [showSampleData, setShowSampleData] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newRoomName, setNewRoomName] = useState('')
  const [newRoomDesc, setNewRoomDesc] = useState('')
  const [newRoomVisibility, setNewRoomVisibility] = useState<'public' | 'private'>('public')

  useEffect(() => {
    if (showSampleData) {
      setRooms(prev => prev.length === 0 ? createSampleData() : prev)
    } else {
      setRooms([])
      setSelectedRoom(null)
      setCurrentView('dashboard')
    }
  }, [showSampleData])

  function handleCreateRoom() {
    if (!newRoomName.trim()) return
    const newRoom: Room = {
      id: generateUUID(),
      name: newRoomName.trim(),
      description: newRoomDesc.trim(),
      visibility: newRoomVisibility,
      status: 'active',
      agents: [],
      users: [],
      messages: [],
      createdAt: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
    }
    setRooms(prev => [...prev, newRoom])
    setNewRoomName('')
    setNewRoomDesc('')
    setNewRoomVisibility('public')
    setShowCreateModal(false)
    setSelectedRoom(newRoom)
    setCurrentView('room-config')
  }

  function handleSelectRoom(room: Room) {
    setSelectedRoom(room)
    setCurrentView('discussion')
  }

  function handleConfigureRoom(room: Room) {
    setSelectedRoom(room)
    setCurrentView('room-config')
  }

  function handleSaveRoom(updatedRoom: Room) {
    setRooms(prev => prev.map(r => r.id === updatedRoom.id ? updatedRoom : r))
    setSelectedRoom(updatedRoom)
  }

  function handleLaunchRoom(updatedRoom: Room) {
    setRooms(prev => prev.map(r => r.id === updatedRoom.id ? updatedRoom : r))
    setSelectedRoom(updatedRoom)
    setCurrentView('discussion')
  }

  function updateRoomFromDiscussion(updated: Room) {
    setRooms(prev => prev.map(r => r.id === updated.id ? updated : r))
    setSelectedRoom(updated)
  }

  function switchRoom(room: Room) {
    setSelectedRoom(room)
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen h-screen bg-background text-foreground flex flex-col overflow-hidden">
        {/* HEADER */}
        <header className="h-12 border-b border-border flex items-center justify-between px-4 flex-shrink-0 bg-card/50">
          <div className="flex items-center gap-3">
            <button onClick={() => { setCurrentView('dashboard'); setSelectedRoom(null) }} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <div className="h-6 w-6 flex items-center justify-center" style={{ backgroundColor: 'hsl(0, 70%, 55%)' }}>
                <FiMessageSquare className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="text-sm font-bold tracking-tight font-serif">AgentRoom</span>
            </button>
            {currentView !== 'dashboard' && selectedRoom && (
              <>
                <span className="text-muted-foreground text-xs">/</span>
                <span className="text-xs text-muted-foreground tracking-tight">{selectedRoom.name}</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Label className="text-xs text-muted-foreground tracking-tight cursor-pointer" htmlFor="sample-toggle">Sample Data</Label>
              <Switch id="sample-toggle" checked={showSampleData} onCheckedChange={setShowSampleData} />
            </div>
            <Separator orientation="vertical" className="h-5" />
            <div className="flex items-center gap-2">
              <Label className="text-xs text-muted-foreground tracking-tight cursor-pointer" htmlFor="admin-toggle">Admin</Label>
              <Switch id="admin-toggle" checked={isAdmin} onCheckedChange={setIsAdmin} />
            </div>
          </div>
        </header>

        {/* MAIN */}
        {currentView === 'dashboard' && (
          <DashboardView
            rooms={rooms}
            onSelect={handleSelectRoom}
            onCreate={() => setShowCreateModal(true)}
            onConfigure={handleConfigureRoom}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
          />
        )}

        {currentView === 'room-config' && selectedRoom && (
          <RoomConfigView
            room={selectedRoom}
            onBack={() => setCurrentView('dashboard')}
            onSave={handleSaveRoom}
            onLaunch={handleLaunchRoom}
          />
        )}

        {currentView === 'discussion' && selectedRoom && (
          <DiscussionView
            rooms={rooms}
            selectedRoom={selectedRoom}
            setSelectedRoom={switchRoom}
            updateRoom={updateRoomFromDiscussion}
            isAdmin={isAdmin}
          />
        )}

        {/* CREATE ROOM MODAL */}
        <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
          <DialogContent className="shadow-none border border-border">
            <DialogHeader>
              <DialogTitle className="font-serif font-bold tracking-tight">Create Discussion Room</DialogTitle>
              <DialogDescription className="text-xs tracking-tight">Set up a new collaborative AI discussion space</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium tracking-tight">Room Name *</Label>
                <Input value={newRoomName} onChange={e => setNewRoomName(e.target.value)} placeholder="e.g., Product Strategy Review" className="shadow-none" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium tracking-tight">Description</Label>
                <Textarea value={newRoomDesc} onChange={e => setNewRoomDesc(e.target.value)} placeholder="What will be discussed in this room?" rows={3} className="shadow-none text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium tracking-tight">Visibility</Label>
                <Select value={newRoomVisibility} onValueChange={v => setNewRoomVisibility(v as 'public' | 'private')}>
                  <SelectTrigger className="shadow-none"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Public</SelectItem>
                    <SelectItem value="private">Private</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateModal(false)} className="shadow-none">Cancel</Button>
              <Button onClick={handleCreateRoom} disabled={!newRoomName.trim()} className="shadow-none">Create Room</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* AGENT STATUS FOOTER */}
        <footer className="border-t border-border px-4 py-2 flex-shrink-0 bg-card/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                <span className="text-xs text-muted-foreground tracking-tight">Room Agent</span>
                <span className="text-xs text-muted-foreground tracking-tight font-mono">({AGENT_ID.slice(0, 8)}...)</span>
              </div>
              {selectedRoom && selectedRoom.agents.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground tracking-tight">|</span>
                  {selectedRoom.agents.map(agent => (
                    <span key={agent.id} className="text-xs text-muted-foreground tracking-tight flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: agent.color }} />
                      {agent.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <span className="text-xs text-muted-foreground tracking-tight">{rooms.length} room{rooms.length !== 1 ? 's' : ''}</span>
          </div>
        </footer>
      </div>
    </ErrorBoundary>
  )
}
