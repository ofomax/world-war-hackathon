# WORLD WAR HACKATHON
## Game Treatment & Design Document

---

## CORE CONCEPT

**World War Hackathon** is a fast-paced, side-scrolling shooter that combines tight action gameplay with intelligent progression systems. Players control a soldier fighting through an endless warzone, using tactical movement, ducking mechanics, and strategic weapon upgrades to survive increasingly challenging waves of enemies.

The game emphasizes **fair but challenging** difficulty through adaptive systems, readable enemy patterns, and rewarding risk/reward mechanics. Every encounter teaches the player something new, and every victory feels earned.

---

## PROGRESSION & PACING

### Stage Structure (Repeatable Template)

The game follows a rhythmic cycle that creates natural breathing room and escalating tension:

#### **1. Warm-up Stretch (15-25 seconds)**
- **Purpose**: Teaching moments and skill introduction
- **Enemy Composition**: 2-4 grunt soldiers spawn in small groups
- **Design Philosophy**: Each wave includes one "teaching moment"
  - Straight-line shooters encourage ducking
  - Grenadiers encourage movement
  - Cover soldiers teach flanking
- **Pacing**: Slower spawn rate, predictable patterns

#### **2. Pressure Stretch (25-45 seconds)**
- **Purpose**: Test learned skills under pressure
- **Enemy Composition**: Mixed spawns (grunts + cover soldiers + occasional grenadier)
- **Design Philosophy**: 
  - Introduce crossfire angles (two enemies shooting from different positions)
  - Spawn placement forces tactical choices: push forward fast or play safe and lose time
  - Creates decision-making tension
- **Pacing**: Faster spawn rate, more simultaneous threats

#### **3. Helicopter Event (Mini-Boss)**
- **Purpose**: High-risk/high-reward encounter
- **Behavior Patterns**:
  - **Strafing Mode**: Predictable burst patterns (learnable)
  - **Hovering Mode**: Suppressive fire that forces movement and ducking windows
- **Visual/Audio Cue**: Clear warning before arrival
- **Reward**: Guaranteed drop (weapon upgrade, buff, or ammo)
- **Frequency**: Every 1000 points

#### **4. Boss Encounter**
- **Purpose**: Skill check and major milestone
- **Spawn Trigger**: Every 100 points
- **Design Philosophy**:
  - Phased difficulty (3 phases per boss)
  - "Fair" patterns that are hard but readable
  - Requires mastery of movement, ducking, and positioning
- **Boss Cycle (3-boss pattern)**:
  - **Boss #1**: Teaches core pattern
  - **Boss #2**: Same pattern + one twist (adds minions or faster bursts)
  - **Boss #3**: Pattern + multiple twists (forces mastery)
  - **After Boss #3**: Health item spawns (checkpoint reward)

#### **5. Recovery Window**
- **Purpose**: Brief lull for repositioning and item collection
- **Duration**: Short period after boss/helicopter defeat
- **Enemy Spawning**: Significantly reduced
- **Design Philosophy**: Allows player to collect drops, reposition, and prepare for next challenge

---

## SPAWNING LOGIC

### Spawn Budget System

The game uses a "threat budget" system that refills over time, ensuring balanced difficulty:

- **Budget Pool**: Maximum 10 points
- **Refill Rate**: 0.5 points per second (adjusts based on player performance)
- **Enemy Costs**:
  - Grunt Soldier: 1 point
  - Cover Soldier: 2 points
  - Grenadier: 3 points
- **Helicopter Events**: Temporarily override budget (special encounter)

### Spawn Rules (Anti-Frustration)

1. **Never spawn enemies directly on top of the player**
2. **Never create unavoidable crossfire without telegraphing**
3. **Don't stack grenadiers too frequently early game**
4. **Ensure each wave has a "shape"** (recognizable pattern)

### Wave Variety

Each wave type serves a specific purpose:

- **Single-Lane Fire**: 1 shooter + 1 mover (teaches basic ducking)
- **Cover Challenge**: 1 cover soldier + 2 grunts pushing (teaches flanking)
- **Grenade Pressure**: Grenadier + 1 shooter (prevents camping)
- **Mixed**: Rotating variety to prevent repetition

---

## ADAPTIVE DIFFICULTY

The game tracks player performance and subtly adjusts difficulty:

### Performance Metrics

- **Time Since Last Hit**: Tracks how long player has avoided damage
- **Kill Speed**: Enemies killed per second (last 5 seconds)
- **Health Level**: Current health percentage

### Difficulty Adjustments

**If Player is Dominating:**
- Slightly faster spawn rate
- More mixed enemy types
- More aggressive helicopter behavior
- Budget refill rate: 0.7 points/second

**If Player is Struggling:**
- Longer gaps between waves
- Fewer simultaneous shooters
- Helicopter uses fewer burst volleys
- Budget refill rate: 0.3 points/second
- Critical health mode: Reduces threat density

**Balanced State:**
- Standard spawn rate
- Normal enemy variety
- Budget refill rate: 0.5 points/second

---

## DUCKING MECHANIC

### Core Design

Ducking is a **crucial defensive mechanic** that rewards timing and awareness:

- **Activation**: Press 'S' key
- **Duration Limit**: Maximum 3 seconds (prevents overuse)
- **Visual Feedback**: Character visibly lowers, bullets pass overhead
- **Hitbox**: Significantly reduced when ducking (only lower legs/feet area)

### Bullet Interaction

- **Most bullets**: Travel at "standing chest/head" height
- **When ducking**: These shots visibly pass above the player (rewarding correct timing)
- **Low shots**: Some enemies occasionally fire low shots (telegraphed)
- **Grenadiers**: Create splash zones that punish staying still

### Duck Windows

Enemies shoot in bursts with pauses—perfect for:
- **Duck → Advance → Shoot → Duck** rhythm
- Creates engaging gameplay loop
- Rewards skillful timing

---

## REWARDS & DROPS

### 1. Helicopter Rewards (Every Kill)

**Guaranteed Drop** when helicopter is destroyed.

**Drop Types** (rotates to stay interesting):
- **Currency/Points**: Always included
- **Temporary Buff**: One of:
  - Faster reload
  - Damage boost
  - Brief shield
  - Speed burst
- **Ammo or Special Charge**: If limited-use abilities exist

**Drop Behavior**:
- Falls to ground and remains for **5 seconds**
- Often lands slightly ahead of player (forces forward push under pressure)
- Creates forward momentum and risk/reward decisions

**Why It's Fun**: Helicopters become high-risk/high-reward targets. Every defeat feels rewarding and creates exciting forward momentum.

### 2. Health Item (Every 3 Bosses Killed)

**Boss Kill Counter System**:
- Track boss defeats
- Every 3 bosses: Spawn guaranteed Health Item
- Reset counter (or roll over for long-term pacing)

**Health Item Collection Rules**:
- Spawns in "safe but not free" location
- Either after boss fight during lull, or mid-fight in risky spot
- Never spawns off-screen or unreachable
- Expires if not collected quickly (prevents hoarding)

**Why It's Challenging**: You earn health by surviving boss cycles, but still must make tactical moves to collect it.

### 3. Grenade Rewards

**Grenade Unlock**: After first boss defeat (5 grenades)

**Grenade Refills**: 
- **Every 2 helicopters defeated**: +5 grenades
- Uses spacebar to throw
- Limited supply creates strategic decisions

**Grenade Mechanics**:
- Arc trajectory
- Explosion radius damages all enemies
- Audio/visual feedback on explosion

---

## BOSS DESIGN LOGIC

### Boss Fight Principles

1. **Readable**: All attacks are telegraphed
2. **Escalating**: Phases increase pressure gradually
3. **Interactive**: Requires movement/ducking, not just shooting

### Boss Cycle Rhythm

- **Boss #1**: Teaches core pattern
- **Boss #2**: Same pattern + one twist (adds minions or faster bursts)
- **Boss #3**: Pattern + multiple twists (forces mastery)
- **After Boss #3**: Health item spawns (feels like checkpoint reward)

This creates a satisfying 3-boss cycle that feels meaningful without being a full reset.

---

## KEEPING DIFFICULTY "TIGHT" BUT FAIR

### Enemy Behavior Rules

- **Soldiers**: Predictable bursts, punish standing still, reward duck timing
- **Cover Soldiers**: Force flanking or timing shots between cover peeks
- **Grenadiers**: Punish camping, but telegraph arcs so skilled players can outplay
- **Helicopters**: Big threat + guaranteed reward = excitement when they appear

### Anti-Frustration Rules

1. **Never spawn grenade + unavoidable straight-line bullet simultaneously** without telegraph
2. **Damage grace period**: Brief invulnerability after taking damage (prevents instant death chains)
3. **Critical health protection**: If player at critical health, slightly reduce simultaneous shooters until stabilization
4. **Fair spawn placement**: Enemies always spawn from right, never on top of player

---

## WIN/LOSE CONDITIONS

### Lose Condition
- **Health reaches 0**: Game Over
- High score saved to Top 3 list

### Win Condition (Future)
- **Reach end distance** and defeat stage boss
- **Final boss encounter** (optional endgame)

### Meta Progression (Future Enhancement)
- Helicopter rewards contribute to upgrades between runs
- Damage, health cap, special ability cooldowns
- Makes repeated attempts feel meaningful

---

## TECHNICAL IMPLEMENTATION

### Key Systems

1. **Spawn Budget Manager**: Tracks threat budget and refill rate
2. **Adaptive Difficulty System**: Monitors player performance and adjusts
3. **Stage Phase Manager**: Controls warmup/pressure/helicopter/boss/recovery cycles
4. **Wave Generator**: Creates varied enemy combinations based on phase
5. **Reward System**: Manages helicopter drops, health items, and grenade rewards
6. **Boss Cycle Tracker**: Manages 3-boss pattern and health item timing

### Player Progression

- **First Boss**: Unlocks grenades (5 grenades)
- **Every 2 Helicopters**: +5 grenades
- **Every 3 Bosses**: Health item (full health restore)
- **Helicopter Drops**: Weapon upgrades, buffs, ammo (rotating)

---

## GAMEPLAY FEEL

### Core Loop

1. **Learn** enemy patterns during warmup
2. **Apply** skills under pressure
3. **Risk/Reward** decisions during helicopter encounters
4. **Master** boss patterns through 3-boss cycles
5. **Recover** and prepare for next challenge

### Player Agency

- **Movement**: Full control over positioning
- **Ducking**: Strategic defensive option (3-second limit prevents abuse)
- **Weapon Choice**: Different weapons for different situations
- **Grenade Management**: Limited supply creates tactical decisions
- **Forward Momentum**: Rewards aggressive play but allows safe play

### Emotional Arc

- **Tension**: Pressure phases create stress
- **Relief**: Recovery windows provide breathing room
- **Excitement**: Helicopter encounters are high-stakes
- **Satisfaction**: Boss defeats feel earned
- **Progression**: Clear sense of getting better and advancing

---

## SUMMARY

**World War Hackathon** is designed to be **challenging but fair**, **repetitive but varied**, and **punishing but rewarding**. The spawn budget system ensures balanced encounters, adaptive difficulty keeps players engaged, and the 3-boss cycle creates meaningful progression milestones.

Every mechanic serves a purpose: ducking rewards skill, grenades create strategic depth, helicopter rewards create forward momentum, and health items reward survival. The game teaches players gradually, tests them under pressure, and rewards mastery.

**The goal**: Create a game that players want to play "just one more time" because each run feels different, each victory feels earned, and each defeat teaches something new.

---

*Document Version: 1.0*  
*Last Updated: 2024*
