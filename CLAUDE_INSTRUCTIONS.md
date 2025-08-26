# Claude Development Instructions - S3ARCH Monorepo

**🚨 CRITICAL: Read this file FIRST before doing any work on S3ARCH**

## 📋 **S3ARCH Project Overview**

S3ARCH is a comprehensive search and discovery platform built on Arweave's permanent web with multiple applications:

- **apps/s3arch/** - Main search application  
- **apps/tim3/** - Collateralized token system (TIM3)
- **packages/** - Shared utilities and components
- **plan/** - Comprehensive planning documentation

## 🎯 **Mandatory Documentation Updates**

**EVERY TIME you work on ANY part of S3ARCH, you MUST update these files:**

### **1. ROOT LEVEL (ALWAYS UPDATE)**
```bash
# Monorepo status files (UPDATE EVERY SESSION)
STATUS.md                              # Overall S3ARCH project status
IMPLEMENTATION_LOG.md                  # Complete development history
GIT_WORKFLOW.md                        # Monorepo git practices
```

### **2. APP SPECIFIC (UPDATE WHEN WORKING ON SPECIFIC APP)**
```bash
# App-specific status (UPDATE WHEN WORKING ON APP)
apps/s3arch/STATUS.md                  # S3ARCH app status
apps/tim3/STATUS.md                    # TIM3 app status  
apps/[future-app]/STATUS.md            # Future app status files
```

### **3. PLANNING DOCS (UPDATE AFTER MAJOR MILESTONES)**
```bash
# Planning documentation (UPDATE WHEN PHASES COMPLETE)
plan/development/README.md             # Development strategy progress
plan/roadmap/README.md                 # Roadmap vs actual progress
plan/CLAUDE_HANDOFF.md                # Original plan with completion tracking
```

## 🔄 **Update Protocol for S3ARCH Monorepo**

### **At Start of Each Session**
1. **Read root STATUS.md first** - understand overall project state
2. **Read IMPLEMENTATION_LOG.md** - understand complete development history
3. **Read app-specific STATUS.md** if working on specific app
4. **Check git log --oneline -10** - see recent cross-project progress
5. **Plan work based on "Next Steps" sections**

### **During Work Session**
- Focus on building/coding the requested component
- Take notes on progress for documentation updates
- Consider impact on other apps in monorepo

### **At End of Each Session**
1. **Update root STATUS.md** with:
   - Overall project progress
   - Cross-app impacts
   - Monorepo-level decisions
   - Next steps for future sessions

2. **Update IMPLEMENTATION_LOG.md** with:
   - Detailed description of work completed
   - Technical achievements across apps
   - Architecture decisions affecting monorepo
   - Integration points between apps

3. **Update app-specific STATUS.md** if worked on specific app

4. **Update planning docs** if major milestones completed

5. **Recommend git commit** with all updated docs

## 📁 **S3ARCH Documentation Architecture**

### **Root Level (Monorepo Overview)**
| File | Purpose | Update Frequency |
|------|---------|------------------|
| `STATUS.md` | Overall S3ARCH status | Every session |
| `IMPLEMENTATION_LOG.md` | Complete development history | Every session |
| `GIT_WORKFLOW.md` | Monorepo git practices | When process changes |
| `CLAUDE_INSTRUCTIONS.md` | This file - master instructions | When system evolves |

### **App Level (Specific Applications)**
| File | Purpose | Update Frequency |
|------|---------|------------------|
| `apps/s3arch/STATUS.md` | S3ARCH app status | When working on s3arch |
| `apps/tim3/STATUS.md` | TIM3 app status | When working on tim3 |
| `apps/[app]/STATUS.md` | Future app status | When working on that app |

### **Planning Level (Strategic Documentation)**
| File | Purpose | Update Frequency |
|------|---------|------------------|
| `plan/development/README.md` | Dev strategy progress | Major milestones |
| `plan/roadmap/README.md` | Timeline vs reality | Major milestones |
| `plan/CLAUDE_HANDOFF.md` | Original requirements | Mark items complete |

## 🎪 **Context Continuity for Monorepo**

### **For User Confidence**
The user should NEVER worry about losing context across ANY S3ARCH work because:

1. **Root STATUS.md** = Instant monorepo context restoration
2. **App STATUS.md files** = Specific app context
3. **IMPLEMENTATION_LOG.md** = Complete development history
4. **Git commits** = Permanent progress record across all apps
5. **Planning docs** = Requirements + cross-app coordination

### **For New Claude Sessions**
Any new Claude can immediately understand:
- **Overall project state** (root STATUS.md)
- **Specific app states** (app STATUS.md files)
- **Complete history** (IMPLEMENTATION_LOG.md)
- **Original vision** (plan documents)
- **Cross-app dependencies** (documented in root files)

## 🚨 **CRITICAL MONOREPO RULES**

### **Documentation Rules (NEVER SKIP)**
1. **Always read root STATUS.md first** before any S3ARCH work
2. **Always update root STATUS.md** before ending session
3. **Always update IMPLEMENTATION_LOG.md** with session details
4. **Always update app STATUS.md** if working on specific app
5. **Always include ALL doc updates in git commits**
6. **Always consider cross-app impacts** in documentation

### **Git Commit Rules for Monorepo**
```bash
# ALWAYS include all relevant doc updates
git add STATUS.md IMPLEMENTATION_LOG.md apps/*/STATUS.md plan/

# ALWAYS use comprehensive commit messages showing scope
git commit -m "feat(tim3): [what was built]

[technical details]
📚 Documentation updated: root STATUS.md, tim3/STATUS.md, IMPLEMENTATION_LOG.md
🏗️ Monorepo: [any cross-app impacts]
🤖 Generated with Claude Code"
```

### **Cross-App Coordination Rules**
- **Document shared dependencies** in root STATUS.md
- **Note impacts on other apps** in IMPLEMENTATION_LOG.md  
- **Coordinate package changes** across consuming apps
- **Maintain consistent patterns** between apps

## 🎯 **Current S3ARCH Status Context**

### **Apps in Monorepo**
- **apps/s3arch/** - Main search application (basic setup)
- **apps/tim3/** - Collateralized token (Mock USDA complete, Coordinator next)
- **packages/** - Shared utilities (to be developed)

### **Development Environment**
- ✅ Monorepo structure with npm workspaces
- ✅ Professional development tools (Homebrew + Node.js)
- ✅ TIM3 has complete testing framework (Lua + Busted)
- ✅ TIM3 has professional build system (Node.js-based)

### **What's Complete Across Monorepo**
- ✅ Monorepo foundation and structure
- ✅ TIM3 project foundation and architecture  
- ✅ TIM3 Mock USDA token (8 passing tests)
- ✅ TIM3 development environment and build pipeline
- ✅ Comprehensive planning documentation
- ✅ Documentation continuity system (TIM3 + now monorepo)

### **What's Next**
- 🟡 **TIM3 Coordinator Process** (immediate priority)
- ⭕ Complete TIM3 system (3 more processes)
- ⭕ TIM3 React frontend
- ⭕ S3ARCH main app development
- ⭕ Shared packages development

## 💡 **Success Pattern for Monorepo**

**Every Claude session should follow this pattern:**

1. **Read Root** → STATUS.md + IMPLEMENTATION_LOG.md (monorepo context)
2. **Read App** → Specific app STATUS.md if working on that app
3. **Plan** → What to build based on "Next Steps" across relevant files
4. **Build** → Focus on coding with explanations + cross-app considerations
5. **Document** → Update root + app STATUS.md + IMPLEMENTATION_LOG.md  
6. **Commit** → Recommend git commit including all doc updates
7. **Context** → Ensure user knows session context is preserved across entire monorepo

This creates an unbreakable chain of context and progress across the entire S3ARCH ecosystem! 🔗

---

**🎯 Ready to continue building S3ARCH with perfect monorepo documentation continuity!**