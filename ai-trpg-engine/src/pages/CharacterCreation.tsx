import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useCharacterStore } from '../stores/characterStore';
import worldlinesData from '../data/worldlines.json';
import talentsData from '../data/talents.json';
import backgroundsData from '../data/backgrounds.json';
import { generateAttributes, drawTalents, groupTalents, createCharacter } from '../services/characterService';
import type { Worldline, Talent, Background, Attributes } from '../utils/types';

type Step = 'worldline' | 'attributes' | 'talents' | 'details' | 'confirm';

export default function CharacterCreation() {
  const navigate = useNavigate();
  const store = useCharacterStore();

  const [step, setStep] = useState<Step>('worldline');
  const [worldlines] = useState<Worldline[]>(worldlinesData as Worldline[]);
  const [talents] = useState<Talent[]>(talentsData as Talent[]);
  const [backgrounds] = useState<Background[]>(backgroundsData as Background[]);

  const [generatedAttributes, setGeneratedAttributes] = useState<Attributes | null>(null);
  const [talentGroups, setTalentGroups] = useState<Talent[][]>([]);
  const [selectedTalents, setSelectedTalents] = useState<Talent[]>([]);

  const [characterName, setCharacterName] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'other'>('male');
  const [selectedBackgrounds, setSelectedBackgrounds] = useState<string[]>([]);

  // Step 1: Select Worldline
  const handleWorldlineSelect = (worldline: Worldline) => {
    store.setSelectedWorldline(worldline);

    // Generate attributes
    const attrs = generateAttributes(worldline);
    setGeneratedAttributes(attrs);

    // Draw talents
    const drawnTalents = drawTalents(talents, worldline.talentPoolIds, 9);
    const grouped = groupTalents(drawnTalents);
    setTalentGroups(grouped);

    setStep('attributes');
  };

  // Step 2: View Attributes and Continue
  const handleContinueFromAttributes = () => {
    setStep('talents');
  };

  // Step 3: Select Talent from Group
  const handleTalentSelect = (groupIndex: number, talent: Talent) => {
    const newSelected = [...selectedTalents];

    // Remove previous selection from this group
    const existingIndex = newSelected.findIndex(t =>
      talentGroups[groupIndex].some(gt => gt.id === t.id)
    );

    if (existingIndex !== -1) {
      newSelected.splice(existingIndex, 1);
    }

    // Add new selection
    newSelected.push(talent);
    setSelectedTalents(newSelected);

    // Auto-advance if all 3 are selected
    if (newSelected.length === 3) {
      setTimeout(() => setStep('details'), 500);
    }
  };

  // Step 4: Toggle Background
  const toggleBackground = (bgId: string) => {
    if (selectedBackgrounds.includes(bgId)) {
      setSelectedBackgrounds(selectedBackgrounds.filter(id => id !== bgId));
    } else {
      setSelectedBackgrounds([...selectedBackgrounds, bgId]);
    }
  };

  // Step 5: Create Character
  const handleCreateCharacter = () => {
    if (!store.selectedWorldline || !generatedAttributes || selectedTalents.length !== 3) {
      return;
    }

    const character = createCharacter(
      characterName,
      gender,
      store.selectedWorldline.id,
      store.selectedWorldline,
      selectedBackgrounds,
      selectedTalents
    );

    // Update character with generated attributes
    character.attributes = generatedAttributes;

    store.setCharacter(character);
    navigate('/game');
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'text-muted-foreground';
      case 'uncommon': return 'text-[var(--color-terminal-green)]';
      case 'rare': return 'text-[var(--color-neon-cyan)]';
      case 'epic': return 'text-[var(--color-neon-magenta)]';
      case 'legendary': return 'text-[var(--color-neon-orange)]';
      default: return 'text-foreground';
    }
  };

  const availableBackgrounds = backgrounds.filter(bg =>
    bg.worldlines.includes(store.selectedWorldline?.id || '')
  );

  return (
    <div className="min-h-screen p-8 grid-bg">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-card rounded-none p-6 border-4 border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="led"></div>
              <h1 className="text-4xl font-bold">CHARACTER.INIT</h1>
            </div>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-2 bg-secondary text-secondary-foreground rounded-none"
            >
              ◀ ABORT
            </button>
          </div>
          <div className="label mt-2">NEW CHARACTER CREATION PROTOCOL</div>
        </div>

        {/* Step Indicator */}
        <div className="bg-card rounded-none p-4 border-4 border-border">
          <div className="flex items-center justify-between font-mono text-sm">
            <div className={step === 'worldline' ? 'terminal-text' : 'text-muted-foreground'}>
              [1] WORLDLINE
            </div>
            <div className="text-muted-foreground">→</div>
            <div className={step === 'attributes' ? 'terminal-text' : 'text-muted-foreground'}>
              [2] ATTRIBUTES
            </div>
            <div className="text-muted-foreground">→</div>
            <div className={step === 'talents' ? 'terminal-text' : 'text-muted-foreground'}>
              [3] TALENTS
            </div>
            <div className="text-muted-foreground">→</div>
            <div className={step === 'details' ? 'terminal-text' : 'text-muted-foreground'}>
              [4] DETAILS
            </div>
            <div className="text-muted-foreground">→</div>
            <div className={step === 'confirm' ? 'terminal-text' : 'text-muted-foreground'}>
              [5] CONFIRM
            </div>
          </div>
        </div>

        {/* Step Content */}
        {step === 'worldline' && (
          <div className="space-y-4">
            <div className="bg-card rounded-none p-6 border-4 border-border">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                <div className="led indicator"></div>
                SELECT HISTORICAL TIMELINE
              </h2>
              <p className="text-sm text-muted-foreground font-mono mb-6">
                &gt; CHOOSE YOUR ERA | DETERMINE INITIAL PARAMETERS
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {worldlines.map((wl) => (
                  <button
                    key={wl.id}
                    onClick={() => handleWorldlineSelect(wl)}
                    className="text-left p-6 bg-background border-4 border-border rounded-none hover:border-primary transition-all group"
                  >
                    <div className="label mb-2">{wl.era}</div>
                    <h3 className="text-xl font-bold mb-3 group-hover:terminal-text transition-colors">
                      {wl.name}
                    </h3>
                    <p className="text-sm text-muted-foreground font-mono line-clamp-3 mb-4">
                      {wl.description}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {wl.culture.slice(0, 3).map((c) => (
                        <span key={c} className="label text-xs px-2 py-1 bg-muted">
                          {c}
                        </span>
                      ))}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 'attributes' && generatedAttributes && (
          <div className="space-y-4">
            <div className="bg-card rounded-none p-6 border-4 border-border">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                <div className="led" style={{ background: 'var(--color-neon-cyan)' }}></div>
                GENERATED ATTRIBUTES
              </h2>
              <p className="text-sm text-muted-foreground font-mono mb-6">
                &gt; RANDOM SEED APPLIED | VALUES DETERMINED BY WORLDLINE PARAMETERS
              </p>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                {Object.entries(generatedAttributes).map(([key, value]) => (
                  <div key={key} className="bg-background border-2 border-border p-4 rounded-none">
                    <div className="label text-xs mb-2">
                      {key.toUpperCase().replace(/([A-Z])/g, ' $1').trim()}
                    </div>
                    <div className="text-4xl font-bold terminal-text font-mono">
                      {value}
                    </div>
                    <div className="mt-2 bg-muted h-2 rounded-none overflow-hidden">
                      <div
                        className="bg-primary h-full transition-all"
                        style={{ width: `${value}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={handleContinueFromAttributes}
                className="w-full py-4 bg-primary text-primary-foreground rounded-none"
              >
                CONTINUE ▶
              </button>
            </div>
          </div>
        )}

        {step === 'talents' && (
          <div className="space-y-4">
            <div className="bg-card rounded-none p-6 border-4 border-border">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                <div className="led" style={{ background: 'var(--color-neon-magenta)' }}></div>
                SELECT TALENTS ({selectedTalents.length}/3)
              </h2>
              <p className="text-sm text-muted-foreground font-mono mb-6">
                &gt; CHOOSE ONE FROM EACH GROUP | THESE DEFINE YOUR CHARACTER'S NATURE
              </p>

              <div className="space-y-6">
                {talentGroups.map((group, groupIndex) => (
                  <div key={groupIndex} className="bg-background border-2 border-border p-4 rounded-none">
                    <div className="label mb-4">GROUP {groupIndex + 1} - SELECT ONE:</div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {group.map((talent) => {
                        const isSelected = selectedTalents.some(t => t.id === talent.id);
                        return (
                          <button
                            key={talent.id}
                            onClick={() => handleTalentSelect(groupIndex, talent)}
                            className={`text-left p-4 border-2 rounded-none transition-all ${
                              isSelected
                                ? 'border-primary bg-primary bg-opacity-20'
                                : 'border-border hover:border-accent'
                            }`}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <span className="text-2xl">{talent.icon}</span>
                              <span className={`label text-xs ${getRarityColor(talent.rarity)}`}>
                                {talent.rarity.toUpperCase()}
                              </span>
                            </div>
                            <h4 className="font-bold mb-2">{talent.name}</h4>
                            <p className="text-xs text-muted-foreground font-mono line-clamp-2">
                              {talent.description}
                            </p>
                            {isSelected && (
                              <div className="mt-2 terminal-text text-xs">✓ SELECTED</div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 'details' && (
          <div className="space-y-4">
            <div className="bg-card rounded-none p-6 border-4 border-border">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                <div className="led" style={{ background: 'var(--color-neon-orange)' }}></div>
                CHARACTER DETAILS
              </h2>

              <div className="space-y-6">
                <div>
                  <label className="label block mb-2">CHARACTER NAME:</label>
                  <input
                    type="text"
                    value={characterName}
                    onChange={(e) => setCharacterName(e.target.value)}
                    placeholder="输入角色姓名..."
                    className="w-full px-4 py-3 rounded-none font-mono"
                  />
                </div>

                <div>
                  <label className="label block mb-2">GENDER:</label>
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { value: 'male', label: '男性 MALE' },
                      { value: 'female', label: '女性 FEMALE' },
                      { value: 'other', label: '其他 OTHER' }
                    ].map((g) => (
                      <button
                        key={g.value}
                        onClick={() => setGender(g.value as any)}
                        className={`py-3 border-2 rounded-none ${
                          gender === g.value
                            ? 'border-primary bg-primary bg-opacity-20'
                            : 'border-border'
                        }`}
                      >
                        {g.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="label block mb-2">BACKGROUND (OPTIONAL):</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {availableBackgrounds.map((bg) => (
                      <button
                        key={bg.id}
                        onClick={() => toggleBackground(bg.id)}
                        className={`text-left p-3 border-2 rounded-none text-sm ${
                          selectedBackgrounds.includes(bg.id)
                            ? 'border-accent bg-accent bg-opacity-20'
                            : 'border-border'
                        }`}
                      >
                        <div className="font-bold mb-1">{bg.name}</div>
                        <div className="text-xs text-muted-foreground font-mono line-clamp-2">
                          {bg.description}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleCreateCharacter}
                  disabled={!characterName.trim() || selectedTalents.length !== 3}
                  className="w-full py-4 bg-primary text-primary-foreground rounded-none disabled:opacity-50 flex items-center justify-center gap-3"
                >
                  <span>✓</span>
                  INITIALIZE CHARACTER
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
