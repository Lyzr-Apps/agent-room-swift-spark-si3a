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
import { FiPlus, FiSettings, FiUsers, FiSend, FiMessageSquare, FiSearch, FiTrash2, FiArrowLeft, FiChevronDown, FiChevronUp, FiActivity, FiCpu, FiUser, FiHash, FiLock, FiGlobe, FiArchive, FiX, FiZap, FiEdit3, FiLogIn, FiAlertCircle, FiShield, FiUserCheck, FiSmile, FiClock, FiCopy, FiKey, FiSun, FiMoon, FiStar, FiHeart, FiEye, FiBookOpen, FiCode, FiFeather, FiThumbsUp, FiThumbsDown, FiMic, FiLayout } from 'react-icons/fi'

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
  avatar: string
}

interface RoomUser {
  id: string
  name: string
  email: string
  role: 'participant' | 'observer' | 'moderator' | 'admin'
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
  isTemplate: boolean
  agents: RoomAgent[]
  users: RoomUser[]
  messages: Message[]
  createdAt: string
  lastActivity: string
  cloneCode: string
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

const EMOJI_CATEGORIES: { label: string; emojis: string[] }[] = [
  { label: 'Smileys', emojis: ['\u{1F600}', '\u{1F603}', '\u{1F604}', '\u{1F601}', '\u{1F605}', '\u{1F602}', '\u{1F923}', '\u{1F60A}', '\u{1F607}', '\u{1F642}', '\u{1F643}', '\u{1F609}', '\u{1F60C}', '\u{1F60D}', '\u{1F618}', '\u{1F617}', '\u{1F61A}', '\u{1F619}', '\u{1F60B}', '\u{1F61B}', '\u{1F61C}', '\u{1F92A}', '\u{1F61D}', '\u{1F911}', '\u{1F917}', '\u{1F914}', '\u{1F910}', '\u{1F928}', '\u{1F610}', '\u{1F611}', '\u{1F636}', '\u{1F60F}', '\u{1F612}', '\u{1F644}', '\u{1F62C}', '\u{1F925}'] },
  { label: 'Gestures', emojis: ['\u{1F44D}', '\u{1F44E}', '\u{1F44A}', '\u{270A}', '\u{1F91B}', '\u{1F91C}', '\u{1F44F}', '\u{1F64C}', '\u{1F450}', '\u{1F932}', '\u{1F91D}', '\u{1F64F}', '\u{270D}\uFE0F', '\u{1F485}', '\u{1F933}', '\u{1F4AA}', '\u{1F9B5}', '\u{1F9B6}', '\u{1F442}', '\u{1F443}', '\u{1F440}', '\u{1F441}\uFE0F', '\u{1F445}', '\u{1F444}', '\u{1F44B}', '\u{1F91A}', '\u{1F590}\uFE0F', '\u{270B}', '\u{1F596}', '\u{1F44C}', '\u{270C}\uFE0F', '\u{1F91E}', '\u{1F91F}', '\u{1F918}', '\u{1F448}', '\u{1F449}'] },
  { label: 'Objects', emojis: ['\u{2764}\uFE0F', '\u{1F4A1}', '\u{1F525}', '\u{2B50}', '\u{1F31F}', '\u{1F4AF}', '\u{1F389}', '\u{1F388}', '\u{1F381}', '\u{1F3C6}', '\u{1F947}', '\u{1F948}', '\u{1F949}', '\u{1F4DA}', '\u{1F4DD}', '\u{1F4CB}', '\u{1F4CA}', '\u{1F4C8}', '\u{1F4C9}', '\u{1F4BB}', '\u{1F4F1}', '\u{2699}\uFE0F', '\u{1F527}', '\u{1F512}', '\u{1F513}', '\u{1F4E7}', '\u{1F4AC}', '\u{1F4AD}', '\u{1F6A8}', '\u{1F514}', '\u{23F0}', '\u{1F680}', '\u{2708}\uFE0F', '\u{1F3AF}', '\u{1F9E9}', '\u{1F4A4}'] },
  { label: 'Reactions', emojis: ['\u{2705}', '\u{274C}', '\u{2757}', '\u{2753}', '\u{1F4A2}', '\u{1F4A5}', '\u{1F4AB}', '\u{1F4A6}', '\u{1F4A8}', '\u{1F4A3}', '\u{1F4AC}', '\u{1F441}\uFE0F\u200D\u{1F5E8}\uFE0F', '\u{1F5E8}\uFE0F', '\u{1F5EF}\uFE0F', '\u{1F44B}', '\u{1F44D}', '\u{1F44E}', '\u{1F44F}', '\u{1F64C}', '\u{1F64F}', '\u{1F4AA}', '\u{1F91D}', '\u{270C}\uFE0F', '\u{1F918}', '\u{1F44C}', '\u{1F525}', '\u{2764}\uFE0F', '\u{1F49B}', '\u{1F49A}', '\u{1F499}', '\u{1F49C}', '\u{1F5A4}', '\u{1F90D}', '\u{1F90E}', '\u{2763}\uFE0F'] },
]

const AGENT_AVATARS: { id: string; label: string; category: string }[] = [
  { id: 'avatar-person-1', label: 'Person A', category: 'People' },
  { id: 'avatar-person-2', label: 'Person B', category: 'People' },
  { id: 'avatar-person-3', label: 'Person C', category: 'People' },
  { id: 'avatar-person-4', label: 'Person D', category: 'People' },
  { id: 'avatar-person-5', label: 'Person E', category: 'People' },
  { id: 'avatar-person-6', label: 'Person F', category: 'People' },
  { id: 'avatar-shield', label: 'Guardian', category: 'Roles' },
  { id: 'avatar-star', label: 'Star', category: 'Roles' },
  { id: 'avatar-heart', label: 'Heart', category: 'Roles' },
  { id: 'avatar-lightning', label: 'Lightning', category: 'Roles' },
  { id: 'avatar-eye', label: 'Observer', category: 'Roles' },
  { id: 'avatar-brain', label: 'Thinker', category: 'Roles' },
  { id: 'avatar-book', label: 'Scholar', category: 'Objects' },
  { id: 'avatar-code', label: 'Coder', category: 'Objects' },
  { id: 'avatar-palette', label: 'Artist', category: 'Objects' },
  { id: 'avatar-globe', label: 'Explorer', category: 'Objects' },
  { id: 'avatar-scale', label: 'Judge', category: 'Objects' },
  { id: 'avatar-thumbsup', label: 'Advocate', category: 'Objects' },
  { id: 'avatar-thumbsdown', label: 'Critic', category: 'Objects' },
  { id: 'avatar-mic', label: 'Speaker', category: 'Objects' },
]

const USER_AVATARS: { id: string; label: string; bgColor: string }[] = [
  { id: 'user-av-1', label: 'Blue', bgColor: 'hsl(210, 70%, 55%)' },
  { id: 'user-av-2', label: 'Red', bgColor: 'hsl(0, 70%, 55%)' },
  { id: 'user-av-3', label: 'Green', bgColor: 'hsl(150, 70%, 45%)' },
  { id: 'user-av-4', label: 'Purple', bgColor: 'hsl(280, 60%, 55%)' },
  { id: 'user-av-5', label: 'Orange', bgColor: 'hsl(30, 80%, 50%)' },
  { id: 'user-av-6', label: 'Teal', bgColor: 'hsl(180, 60%, 45%)' },
  { id: 'user-av-7', label: 'Pink', bgColor: 'hsl(330, 65%, 55%)' },
  { id: 'user-av-8', label: 'Indigo', bgColor: 'hsl(240, 60%, 55%)' },
  { id: 'user-av-9', label: 'Amber', bgColor: 'hsl(45, 80%, 50%)' },
  { id: 'user-av-10', label: 'Slate', bgColor: 'hsl(210, 15%, 45%)' },
  { id: 'user-av-11', label: 'Rose', bgColor: 'hsl(350, 65%, 55%)' },
  { id: 'user-av-12', label: 'Emerald', bgColor: 'hsl(160, 70%, 40%)' },
]

// ============================================================
// SAMPLE DATA FACTORY
// ============================================================

function createSampleData(): Room[] {
  return [
    {
      id: 'sample-room-1',
      name: 'Product Strategy Review',
      description: 'Multi-perspective analysis of Q2 product roadmap with research, design, and engineering viewpoints.',
      visibility: 'private',
      status: 'active',
      isTemplate: false,
      agents: [
        {
          id: 'agent-ra-1',
          name: 'ResearchAnalyst',
          systemPrompt: 'You are a meticulous research analyst. Provide data-driven insights, cite relevant studies, and challenge assumptions with evidence. Always back claims with references.',
          personality: 'analytical',
          temperature: 0.3,
          topP: 0.9,
          responseLength: 'long',
          trigger: 'all',
          frequency: 'every',
          interAgentRules: 'reference',
          color: AGENT_COLORS[0],
          avatar: '',
        },
        {
          id: 'agent-cd-1',
          name: 'CreativeDirector',
          systemPrompt: 'You are an imaginative creative director. Think outside the box, propose bold ideas, and push boundaries. Challenge conventional thinking with fresh perspectives.',
          personality: 'creative',
          temperature: 0.8,
          topP: 0.95,
          responseLength: 'medium',
          trigger: 'all',
          frequency: 'every',
          interAgentRules: 'reference',
          color: AGENT_COLORS[1],
          avatar: '',
        },
        {
          id: 'agent-da-1',
          name: 'DevilsAdvocate',
          systemPrompt: 'You challenge every idea presented. Find flaws, risks, and weaknesses. Be constructively critical while maintaining professionalism.',
          personality: 'provocative',
          temperature: 0.6,
          topP: 0.85,
          responseLength: 'medium',
          trigger: 'mentions',
          frequency: 'every',
          interAgentRules: 'reference',
          color: AGENT_COLORS[4],
          avatar: '',
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
          sender: 'ResearchAnalyst',
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
          sender: 'CreativeDirector',
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
      cloneCode: 'strategy2024',
    },
    {
      id: 'sample-room-2',
      name: 'Tech Architecture Planning',
      description: 'Evaluating microservices migration strategy with security, performance, and cost perspectives.',
      visibility: 'public',
      status: 'active',
      isTemplate: false,
      agents: [
        {
          id: 'agent-se-1',
          name: 'SecurityExpert',
          systemPrompt: 'You are a cybersecurity specialist. Evaluate all proposals through a security lens. Identify vulnerabilities, compliance risks, and recommend security-first approaches.',
          personality: 'formal',
          temperature: 0.2,
          topP: 0.8,
          responseLength: 'long',
          trigger: 'all',
          frequency: 'every',
          interAgentRules: 'independent',
          color: AGENT_COLORS[2],
          avatar: 'avatar-shield',
        },
        {
          id: 'agent-co-1',
          name: 'CostOptimizer',
          systemPrompt: 'You analyze everything from a cost-efficiency perspective. Provide ROI calculations, budget implications, and cost-saving alternatives.',
          personality: 'analytical',
          temperature: 0.3,
          topP: 0.85,
          responseLength: 'medium',
          trigger: 'all',
          frequency: 'every',
          interAgentRules: 'reference',
          color: AGENT_COLORS[3],
          avatar: '',
        },
      ],
      users: [
        { id: 'user-3', name: 'Alex Turner', email: 'alex@company.com', role: 'moderator' },
      ],
      messages: [],
      createdAt: new Date(Date.now() - 172800000).toISOString(),
      lastActivity: new Date(Date.now() - 172800000).toISOString(),
      cloneCode: 'techarch99',
    },
    {
      id: 'sample-room-3',
      name: 'Marketing Campaign Brainstorm',
      description: 'Open brainstorming session for upcoming product launch campaign with brand and growth agents.',
      visibility: 'public',
      status: 'active',
      isTemplate: false,
      agents: [
        {
          id: 'agent-bs-1',
          name: 'BrandStrategist',
          systemPrompt: 'You are a brand strategy expert. Focus on brand positioning, messaging frameworks, and audience resonance. Ensure all ideas align with brand values.',
          personality: 'supportive',
          temperature: 0.5,
          topP: 0.9,
          responseLength: 'medium',
          trigger: 'all',
          frequency: 'every',
          interAgentRules: 'reference',
          color: AGENT_COLORS[5],
          avatar: 'avatar-palette',
        },
      ],
      users: [
        { id: 'user-4', name: 'Jamie Ross', email: 'jamie@company.com', role: 'participant' },
      ],
      messages: [],
      createdAt: new Date(Date.now() - 43200000).toISOString(),
      lastActivity: new Date(Date.now() - 43200000).toISOString(),
      cloneCode: 'brand2024',
    },
    // TEMPLATE ROOMS
    {
      id: 'template-1',
      name: 'Customer Support Team',
      description: 'Template: Pre-configured support room with empathetic responder, knowledge expert, and escalation handler agents.',
      visibility: 'public',
      status: 'active',
      isTemplate: true,
      agents: [
        {
          id: 'tpl-agent-1',
          name: 'EmpathyResponder',
          systemPrompt: 'You are a warm, empathetic customer support agent. Listen actively, acknowledge feelings, and provide reassuring responses. Always prioritize the customer experience.',
          personality: 'supportive',
          temperature: 0.4,
          topP: 0.9,
          responseLength: 'medium',
          trigger: 'all',
          frequency: 'every',
          interAgentRules: 'reference',
          color: AGENT_COLORS[0],
          avatar: 'avatar-heart',
        },
        {
          id: 'tpl-agent-2',
          name: 'KnowledgeExpert',
          systemPrompt: 'You are a technical knowledge expert. Provide accurate, detailed answers based on documentation and best practices. Cite sources when possible.',
          personality: 'analytical',
          temperature: 0.2,
          topP: 0.85,
          responseLength: 'long',
          trigger: 'mentions',
          frequency: 'every',
          interAgentRules: 'reference',
          color: AGENT_COLORS[1],
          avatar: 'avatar-book',
        },
      ],
      users: [],
      messages: [],
      createdAt: new Date(Date.now() - 604800000).toISOString(),
      lastActivity: new Date(Date.now() - 604800000).toISOString(),
      cloneCode: '',
    },
    {
      id: 'template-2',
      name: 'Debate Forum',
      description: 'Template: Structured debate room with pro, con, and moderator agents for balanced argument analysis.',
      visibility: 'public',
      status: 'active',
      isTemplate: true,
      agents: [
        {
          id: 'tpl-agent-3',
          name: 'ProAdvocate',
          systemPrompt: 'You argue in favor of the topic presented. Build strong, logical arguments with evidence. Be persuasive but fair.',
          personality: 'formal',
          temperature: 0.5,
          topP: 0.9,
          responseLength: 'medium',
          trigger: 'all',
          frequency: 'every',
          interAgentRules: 'reference',
          color: AGENT_COLORS[2],
          avatar: 'avatar-thumbsup',
        },
        {
          id: 'tpl-agent-4',
          name: 'ConCritic',
          systemPrompt: 'You argue against the topic presented. Find weaknesses, counterarguments, and risks. Be rigorous but respectful.',
          personality: 'provocative',
          temperature: 0.5,
          topP: 0.9,
          responseLength: 'medium',
          trigger: 'all',
          frequency: 'every',
          interAgentRules: 'reference',
          color: AGENT_COLORS[4],
          avatar: 'avatar-thumbsdown',
        },
        {
          id: 'tpl-agent-5',
          name: 'DebateModerator',
          systemPrompt: 'You moderate the debate. Summarize key points from both sides, ensure fair representation, and guide the discussion toward productive conclusions.',
          personality: 'formal',
          temperature: 0.3,
          topP: 0.85,
          responseLength: 'long',
          trigger: 'proactive',
          frequency: 'every-2nd',
          interAgentRules: 'reference',
          color: AGENT_COLORS[3],
          avatar: 'avatar-scale',
        },
      ],
      users: [],
      messages: [],
      createdAt: new Date(Date.now() - 604800000).toISOString(),
      lastActivity: new Date(Date.now() - 604800000).toISOString(),
      cloneCode: '',
    },
  ]
}

// ============================================================
// HELPERS
// ============================================================

function renderMarkdown(text: string) {
  if (!text) return null
  return (
    <div className="space-y-1.5">
      {text.split('\n').map((line, i) => {
        if (line.startsWith('### ')) return <h4 key={i} className="font-semibold text-sm mt-3 mb-1">{line.slice(4)}</h4>
        if (line.startsWith('## ')) return <h3 key={i} className="font-semibold text-base mt-3 mb-1">{line.slice(3)}</h3>
        if (line.startsWith('# ')) return <h2 key={i} className="font-bold text-lg mt-4 mb-2">{line.slice(2)}</h2>
        if (line.startsWith('- ') || line.startsWith('* ')) return <li key={i} className="ml-4 list-disc text-sm leading-relaxed">{formatInline(line.slice(2))}</li>
        if (/^\d+\.\s/.test(line)) return <li key={i} className="ml-4 list-decimal text-sm leading-relaxed">{formatInline(line.replace(/^\d+\.\s/, ''))}</li>
        if (!line.trim()) return <div key={i} className="h-1" />
        return <p key={i} className="text-sm leading-relaxed">{formatInline(line)}</p>
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

function getAgentAvatarIcon(avatarId: string, className?: string): React.ReactNode | null {
  if (!avatarId) return null
  const cls = className || 'h-3.5 w-3.5'
  const iconMap: Record<string, React.ReactNode> = {
    'avatar-person-1': <FiUser className={cls} />,
    'avatar-person-2': <FiUser className={cls} />,
    'avatar-person-3': <FiUser className={cls} />,
    'avatar-person-4': <FiUser className={cls} />,
    'avatar-person-5': <FiUser className={cls} />,
    'avatar-person-6': <FiUser className={cls} />,
    'avatar-shield': <FiShield className={cls} />,
    'avatar-star': <FiStar className={cls} />,
    'avatar-heart': <FiHeart className={cls} />,
    'avatar-lightning': <FiZap className={cls} />,
    'avatar-eye': <FiEye className={cls} />,
    'avatar-brain': <FiCpu className={cls} />,
    'avatar-book': <FiBookOpen className={cls} />,
    'avatar-code': <FiCode className={cls} />,
    'avatar-palette': <FiFeather className={cls} />,
    'avatar-globe': <FiGlobe className={cls} />,
    'avatar-scale': <FiActivity className={cls} />,
    'avatar-thumbsup': <FiThumbsUp className={cls} />,
    'avatar-thumbsdown': <FiThumbsDown className={cls} />,
    'avatar-mic': <FiMic className={cls} />,
  }
  return iconMap[avatarId] || null
}

function extractAgentResponseText(result: any): string {
  if (!result) return ''
  const r = result?.response?.result
  if (r) {
    if (typeof r === 'string') return r
    if (r.response) return String(r.response)
    if (r.text) return String(r.text)
    if (r.message) return String(r.message)
    if (r.content) return String(r.content)
    if (r.answer) return String(r.answer)
  }
  if (result?.response?.message && typeof result.response.message === 'string') {
    return result.response.message
  }
  if (result?.raw_response && typeof result.raw_response === 'string') {
    try {
      const parsed = JSON.parse(result.raw_response)
      if (parsed?.response) return String(parsed.response)
      if (parsed?.text) return String(parsed.text)
      if (parsed?.message) return String(parsed.message)
    } catch {
      return result.raw_response
    }
  }
  if (result?.response && typeof result.response === 'string') {
    return result.response
  }
  return ''
}

function extractAgentMetadata(result: any, fallbackName: string, fallbackPersonality: string) {
  const r = result?.response?.result
  return {
    agent_name: r?.agent_name || fallbackName,
    confidence: typeof r?.confidence === 'number' ? r.confidence : 0,
    tone: r?.tone || fallbackPersonality,
    references: Array.isArray(r?.references) ? r.references.filter((ref: any) => typeof ref === 'string' && ref.trim()) : [],
  }
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

function AgentAvatar({ name, color, avatar, size = 'md' }: { name: string; color: string; avatar?: string; size?: 'sm' | 'md' | 'lg' }) {
  const cls = size === 'sm' ? 'h-6 w-6 text-xs' : size === 'lg' ? 'h-10 w-10 text-base' : 'h-8 w-8 text-sm'
  const iconCls = size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'
  const icon = avatar ? getAgentAvatarIcon(avatar, iconCls) : null
  return (
    <div className={cn('flex items-center justify-center font-bold text-white flex-shrink-0', cls)} style={{ backgroundColor: color }}>
      {icon || getInitial(name)}
    </div>
  )
}

function UserAvatar({ name, avatarId, size = 'md' }: { name: string; avatarId?: string; size?: 'sm' | 'md' | 'lg' }) {
  const cls = size === 'sm' ? 'h-6 w-6 text-xs' : size === 'lg' ? 'h-10 w-10 text-base' : 'h-8 w-8 text-sm'
  const iconCls = size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'
  const userAv = avatarId ? USER_AVATARS.find(a => a.id === avatarId) : null
  if (userAv) {
    return (
      <div className={cn('flex items-center justify-center font-bold text-white flex-shrink-0', cls)} style={{ backgroundColor: userAv.bgColor }}>
        <FiUser className={iconCls} />
      </div>
    )
  }
  return (
    <div className={cn('flex items-center justify-center font-bold bg-secondary text-secondary-foreground flex-shrink-0', cls)}>
      {getInitial(name)}
    </div>
  )
}

function PersonalityBadge({ personality }: { personality: string }) {
  return <Badge variant="outline" className="text-[10px] capitalize border-border h-4 px-1.5">{personality}</Badge>
}

function TypingDots({ agentName, color }: { agentName: string; color?: string }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="flex gap-1">
        <span className="h-1.5 w-1.5 rounded-full animate-bounce" style={{ backgroundColor: color || 'hsl(0,0%,55%)', animationDelay: '0ms' }} />
        <span className="h-1.5 w-1.5 rounded-full animate-bounce" style={{ backgroundColor: color || 'hsl(0,0%,55%)', animationDelay: '150ms' }} />
        <span className="h-1.5 w-1.5 rounded-full animate-bounce" style={{ backgroundColor: color || 'hsl(0,0%,55%)', animationDelay: '300ms' }} />
      </div>
      <span className="text-xs text-muted-foreground tracking-tight">{agentName} is thinking...</span>
    </div>
  )
}

// ============================================================
// USER IDENTITY ENTRY WITH ROLE SELECTION + AVATAR PICKER
// ============================================================

const ADMIN_PASSCODE = 'admin123'

function UserIdentityEntry({ onJoin }: { onJoin: (name: string, role: 'admin' | 'participant', avatarId: string) => void }) {
  const [name, setName] = useState('')
  const [selectedRole, setSelectedRole] = useState<'admin' | 'participant' | null>(null)
  const [adminCode, setAdminCode] = useState('')
  const [codeError, setCodeError] = useState('')
  const [selectedAvatar, setSelectedAvatar] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (name.trim().length < 2 || !selectedRole || !selectedAvatar) return

    if (selectedRole === 'admin') {
      if (adminCode !== ADMIN_PASSCODE) {
        setCodeError('Invalid admin passcode. Try again or enter as a participant.')
        return
      }
    }

    onJoin(name.trim(), selectedRole, selectedAvatar)
  }

  const canSubmit = name.trim().length >= 2 && selectedRole !== null && selectedAvatar !== '' && (selectedRole === 'participant' || adminCode.length > 0)

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
      <div className="w-full max-w-md mx-auto p-8">
        <div className="flex flex-col items-center mb-8">
          <div className="h-12 w-12 flex items-center justify-center mb-4" style={{ backgroundColor: 'hsl(0, 70%, 55%)' }}>
            <FiMessageSquare className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight font-serif">AgentRoom</h1>
          <p className="text-sm text-muted-foreground mt-2 tracking-tight leading-relaxed text-center">
            Multi-agent collaborative discussion platform.
            Choose how you want to join.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium tracking-tight">Your Display Name</Label>
            <Input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g., Sarah Chen"
              className="shadow-none"
              autoFocus
              minLength={2}
              maxLength={30}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-medium tracking-tight">Choose Your Avatar</Label>
            <div className="grid grid-cols-6 gap-2">
              {USER_AVATARS.map(av => (
                <button
                  key={av.id}
                  type="button"
                  onClick={() => setSelectedAvatar(av.id)}
                  className={cn(
                    'flex flex-col items-center gap-1 p-1.5 border transition-colors',
                    selectedAvatar === av.id
                      ? 'border-foreground bg-secondary'
                      : 'border-border hover:border-foreground/30 hover:bg-secondary/50'
                  )}
                >
                  <div className="h-10 w-10 flex items-center justify-center text-white" style={{ backgroundColor: av.bgColor }}>
                    <FiUser className="h-5 w-5" />
                  </div>
                  <span className="text-[10px] text-muted-foreground tracking-tight">{av.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-medium tracking-tight">Select Your Role</Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => { setSelectedRole('admin'); setCodeError('') }}
                className={cn(
                  'p-4 border text-left transition-colors',
                  selectedRole === 'admin'
                    ? 'border-foreground bg-secondary'
                    : 'border-border hover:border-foreground/30 hover:bg-secondary/50'
                )}
              >
                <div className="flex items-center gap-2 mb-2">
                  <FiShield className="h-4 w-4" style={selectedRole === 'admin' ? { color: 'hsl(0, 70%, 55%)' } : {}} />
                  <span className="text-sm font-semibold tracking-tight">Admin</span>
                </div>
                <p className="text-xs text-muted-foreground tracking-tight leading-relaxed">
                  Create rooms, configure agents, manage users and room settings
                </p>
              </button>
              <button
                type="button"
                onClick={() => { setSelectedRole('participant'); setCodeError('') }}
                className={cn(
                  'p-4 border text-left transition-colors',
                  selectedRole === 'participant'
                    ? 'border-foreground bg-secondary'
                    : 'border-border hover:border-foreground/30 hover:bg-secondary/50'
                )}
              >
                <div className="flex items-center gap-2 mb-2">
                  <FiUserCheck className="h-4 w-4" style={selectedRole === 'participant' ? { color: 'hsl(0, 70%, 55%)' } : {}} />
                  <span className="text-sm font-semibold tracking-tight">Participant</span>
                </div>
                <p className="text-xs text-muted-foreground tracking-tight leading-relaxed">
                  Join rooms, chat with agents, view discussions and agent details
                </p>
              </button>
            </div>
          </div>

          {selectedRole === 'admin' && (
            <div className="space-y-1.5">
              <Label className="text-xs font-medium tracking-tight">Admin Passcode</Label>
              <Input
                type="password"
                value={adminCode}
                onChange={e => { setAdminCode(e.target.value); setCodeError('') }}
                placeholder="Enter admin passcode"
                className="shadow-none"
              />
              {codeError && (
                <p className="text-xs tracking-tight flex items-center gap-1" style={{ color: 'hsl(0, 70%, 55%)' }}>
                  <FiAlertCircle className="h-3 w-3" />
                  {codeError}
                </p>
              )}
              <p className="text-xs text-muted-foreground tracking-tight">
                Contact your organization administrator for the passcode
              </p>
            </div>
          )}

          <Button
            type="submit"
            disabled={!canSubmit}
            className="w-full shadow-none gap-2"
            style={canSubmit ? { backgroundColor: 'hsl(0, 70%, 55%)', color: 'white' } : {}}
          >
            {selectedRole === 'admin' ? <FiShield className="h-4 w-4" /> : <FiLogIn className="h-4 w-4" />}
            {selectedRole === 'admin' ? 'Enter as Admin' : selectedRole === 'participant' ? 'Enter as Participant' : 'Select a role'}
          </Button>
        </form>
      </div>
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
  onViewHistory,
  onCloneRoom,
  searchQuery,
  setSearchQuery,
  isAdmin,
}: {
  rooms: Room[]
  onSelect: (room: Room) => void
  onCreate: () => void
  onConfigure: (room: Room) => void
  onViewHistory: (room: Room) => void
  onCloneRoom: (room: Room) => void
  searchQuery: string
  setSearchQuery: (q: string) => void
  isAdmin: boolean
}) {
  const [dashboardTab, setDashboardTab] = useState<'active' | 'templates'>('active')

  const filtered = rooms.filter(
    r => r.name.toLowerCase().includes(searchQuery.toLowerCase()) || r.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const activeRooms = filtered.filter(r => !r.isTemplate)
  const templateRooms = filtered.filter(r => r.isTemplate)
  const displayRooms = dashboardTab === 'active' ? activeRooms : templateRooms

  return (
    <div className="flex-1 overflow-y-auto p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight font-serif">Discussion Rooms</h1>
            <p className="text-sm text-muted-foreground mt-1 tracking-tight leading-relaxed">
              {isAdmin ? 'Manage and configure collaborative AI discussion rooms' : 'Join a discussion room to collaborate with AI agents'}
            </p>
          </div>
          {isAdmin && (
            <Button onClick={onCreate} className="shadow-none gap-2">
              <FiPlus className="h-4 w-4" />
              Create Room
            </Button>
          )}
        </div>

        <div className="flex items-center gap-4 mb-6">
          <div className="flex items-center border border-border">
            <button
              onClick={() => setDashboardTab('active')}
              className={cn(
                'px-4 py-2 text-sm tracking-tight transition-colors flex items-center gap-1.5',
                dashboardTab === 'active' ? 'bg-secondary text-foreground font-medium' : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
              )}
            >
              <FiMessageSquare className="h-3.5 w-3.5" />
              Active Rooms
              <Badge variant="outline" className="text-[10px] h-4 px-1 ml-1">{activeRooms.length}</Badge>
            </button>
            <button
              onClick={() => setDashboardTab('templates')}
              className={cn(
                'px-4 py-2 text-sm tracking-tight transition-colors flex items-center gap-1.5',
                dashboardTab === 'templates' ? 'bg-secondary text-foreground font-medium' : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
              )}
            >
              <FiLayout className="h-3.5 w-3.5" />
              Templates
              <Badge variant="outline" className="text-[10px] h-4 px-1 ml-1">{templateRooms.length}</Badge>
            </button>
          </div>
          <div className="relative flex-1">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search rooms..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10 shadow-none" />
          </div>
        </div>

        {displayRooms.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="h-16 w-16 bg-secondary flex items-center justify-center mb-4">
              {dashboardTab === 'templates' ? <FiLayout className="h-8 w-8 text-muted-foreground" /> : <FiMessageSquare className="h-8 w-8 text-muted-foreground" />}
            </div>
            <h3 className="text-lg font-semibold tracking-tight font-serif mb-2">
              {dashboardTab === 'templates' ? 'No templates yet' : 'No rooms yet'}
            </h3>
            <p className="text-sm text-muted-foreground tracking-tight leading-relaxed max-w-sm">
              {dashboardTab === 'templates'
                ? (isAdmin ? 'Create a template room to let users quickly spin up pre-configured discussion rooms.' : 'No templates are available yet.')
                : (isAdmin
                  ? 'Create your first discussion room to start collaborative AI conversations with multiple agent perspectives.'
                  : 'No rooms are available. Ask an admin to create a room and add you as a participant.')}
            </p>
            {isAdmin && dashboardTab === 'active' && (
              <Button onClick={onCreate} className="shadow-none gap-2 mt-6">
                <FiPlus className="h-4 w-4" />
                Create Your First Room
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayRooms.map(room => (
              <Card
                key={room.id}
                className={cn('shadow-none border border-border hover:border-foreground/30 transition-colors cursor-pointer group', room.isTemplate ? 'border-dashed' : '')}
                onClick={() => room.isTemplate ? onCloneRoom(room) : onSelect(room)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      {room.isTemplate && (
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <FiLayout className="h-3 w-3" style={{ color: 'hsl(0, 70%, 55%)' }} />
                          <span className="text-[10px] font-medium tracking-tight uppercase" style={{ color: 'hsl(0, 70%, 55%)' }}>Template</span>
                        </div>
                      )}
                      <CardTitle className="text-base font-bold tracking-tight font-serif truncate">{room.name}</CardTitle>
                      <CardDescription className="text-xs mt-1 tracking-tight leading-relaxed line-clamp-2">{room.description}</CardDescription>
                    </div>
                    <div className="flex items-center gap-1">
                      {room.isTemplate ? (
                        <>
                          <Button variant="ghost" size="sm" className="shadow-none h-7 w-7 p-0" title="Use template" onClick={e => { e.stopPropagation(); onCloneRoom(room) }}>
                            <FiCopy className="h-3.5 w-3.5" />
                          </Button>
                          {isAdmin && (
                            <Button variant="ghost" size="sm" className="shadow-none h-7 w-7 p-0" title="Configure template" onClick={e => { e.stopPropagation(); onConfigure(room) }}>
                              <FiSettings className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </>
                      ) : (
                        <>
                          <Button variant="ghost" size="sm" className="shadow-none h-7 w-7 p-0" title="Clone room" onClick={e => { e.stopPropagation(); onCloneRoom(room) }}>
                            <FiCopy className="h-3.5 w-3.5" />
                          </Button>
                          {isAdmin && (
                            <>
                              <Button variant="ghost" size="sm" className="shadow-none h-7 w-7 p-0" title="View history" onClick={e => { e.stopPropagation(); onViewHistory(room) }}>
                                <FiClock className="h-3.5 w-3.5" />
                              </Button>
                              <Button variant="ghost" size="sm" className="shadow-none h-7 w-7 p-0" title="Configure" onClick={e => { e.stopPropagation(); onConfigure(room) }}>
                                <FiSettings className="h-3.5 w-3.5" />
                              </Button>
                            </>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pb-4">
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><FiCpu className="h-3 w-3" />{room.agents.length} agent{room.agents.length !== 1 ? 's' : ''}</span>
                    {!room.isTemplate && <span className="flex items-center gap-1"><FiUser className="h-3 w-3" />{room.users.length} user{room.users.length !== 1 ? 's' : ''}</span>}
                    <span className="flex items-center gap-1">{room.visibility === 'private' ? <FiLock className="h-3 w-3" /> : <FiGlobe className="h-3 w-3" />}{room.visibility}</span>
                  </div>
                  <Separator className="my-3" />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      {room.isTemplate ? (
                        <>
                          <FiLayout className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">Blueprint</span>
                        </>
                      ) : (
                        <>
                          <span className={cn('inline-block h-2 w-2 rounded-full', room.status === 'active' ? 'bg-green-500' : 'bg-muted-foreground')} />
                          <span className="text-xs text-muted-foreground capitalize">{room.status}</span>
                        </>
                      )}
                    </div>
                    {room.isTemplate ? (
                      <span className="text-xs tracking-tight font-medium flex items-center gap-1" style={{ color: 'hsl(0, 70%, 55%)' }}>
                        <FiCopy className="h-3 w-3" />
                        Use Template
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">{timeAgo(room.lastActivity)}</span>
                    )}
                  </div>
                  {room.agents.length > 0 && (
                    <div className="flex items-center gap-1.5 mt-3 flex-wrap">
                      {room.agents.map(agent => (
                        <span key={agent.id} className="flex items-center gap-1 text-xs text-muted-foreground">
                          <span className="h-1.5 w-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: agent.color }} />
                          {agent.name}
                        </span>
                      ))}
                    </div>
                  )}
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
  const [inviteRole, setInviteRole] = useState<'participant' | 'observer' | 'moderator' | 'admin'>('participant')
  const [saved, setSaved] = useState(false)

  const selectedAgent = editRoom.agents.find(a => a.id === selectedAgentId) ?? null

  function updateAgent(agentId: string, updates: Partial<RoomAgent>) {
    setEditRoom(prev => ({
      ...prev,
      agents: prev.agents.map(a => a.id === agentId ? { ...a, ...updates } : a),
    }))
    setSaved(false)
  }

  function addAgent() {
    const colorIdx = editRoom.agents.length % AGENT_COLORS.length
    const newAgent: RoomAgent = {
      id: generateUUID(),
      name: 'NewAgent',
      systemPrompt: '',
      personality: 'analytical',
      temperature: 0.5,
      topP: 0.9,
      responseLength: 'medium',
      trigger: 'all',
      frequency: 'every',
      interAgentRules: 'reference',
      color: AGENT_COLORS[colorIdx],
      avatar: '',
    }
    setEditRoom(prev => ({ ...prev, agents: [...prev.agents, newAgent] }))
    setSelectedAgentId(newAgent.id)
    setSaved(false)
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
    setSaved(false)
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
    setSaved(false)
  }

  function removeUser(userId: string) {
    setEditRoom(prev => ({ ...prev, users: prev.users.filter(u => u.id !== userId) }))
    setSaved(false)
  }

  function handleSave() {
    onSave(editRoom)
    setSaved(true)
  }

  const avatarCategories = [...new Set(AGENT_AVATARS.map(a => a.category))]

  return (
    <div className="flex-1 overflow-y-auto p-6 lg:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="sm" onClick={onBack} className="shadow-none gap-1">
            <FiArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <Separator orientation="vertical" className="h-5" />
          <h1 className="text-xl font-bold tracking-tight font-serif">
            {editRoom.isTemplate ? 'Configure Template' : 'Configure Room'}
          </h1>
          <span className="text-sm text-muted-foreground tracking-tight">- {editRoom.name}</span>
          {editRoom.isTemplate && <Badge variant="outline" className="text-xs" style={{ borderColor: 'hsl(0, 70%, 55%)', color: 'hsl(0, 70%, 55%)' }}>Template</Badge>}
          {saved && <Badge variant="outline" className="text-xs border-green-500 text-green-500">Saved</Badge>}
        </div>

        <Tabs defaultValue="agents" className="w-full">
          <TabsList className="w-full justify-start bg-secondary">
            <TabsTrigger value="agents" className="gap-1.5"><FiCpu className="h-3.5 w-3.5" />Agents</TabsTrigger>
            {!editRoom.isTemplate && <TabsTrigger value="users" className="gap-1.5"><FiUsers className="h-3.5 w-3.5" />Users</TabsTrigger>}
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
                    <div className="text-center py-8 border border-dashed border-border">
                      <FiCpu className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
                      <p className="text-xs text-muted-foreground tracking-tight">No agents configured yet.</p>
                      <p className="text-xs text-muted-foreground tracking-tight mt-1">Click Add to create your first agent.</p>
                    </div>
                  ) : (
                    editRoom.agents.map(agent => (
                      <div key={agent.id} className={cn('flex items-center gap-3 p-3 border border-border cursor-pointer transition-colors', selectedAgentId === agent.id ? 'bg-secondary border-foreground/30' : 'hover:bg-secondary/50')} onClick={() => setSelectedAgentId(agent.id)}>
                        <AgentAvatar name={agent.name} color={agent.color} avatar={agent.avatar} size="sm" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium tracking-tight truncate">{agent.name}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <PersonalityBadge personality={agent.personality} />
                            <span className="text-[10px] text-muted-foreground capitalize">{agent.trigger}</span>
                          </div>
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
                        <AgentAvatar name={selectedAgent.name} color={selectedAgent.color} avatar={selectedAgent.avatar} />
                        <div>
                          <CardTitle className="text-base font-bold tracking-tight font-serif">Agent Configuration</CardTitle>
                          <CardDescription className="text-xs tracking-tight">Configure behavior for {selectedAgent.name}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-5">
                      {/* AVATAR PICKER */}
                      <div className="space-y-2">
                        <Label className="text-xs font-medium tracking-tight">Avatar</Label>
                        <div className="space-y-3">
                          {avatarCategories.map(cat => (
                            <div key={cat}>
                              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium mb-1.5">{cat}</p>
                              <div className="flex flex-wrap gap-1.5">
                                {cat === avatarCategories[0] && (
                                  <button
                                    onClick={() => updateAgent(selectedAgent.id, { avatar: '' })}
                                    className={cn(
                                      'h-9 w