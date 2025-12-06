"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id, Doc } from "@/convex/_generated/dataModel";

type StepDoc = Doc<"coachMarkSteps">;
type SequenceDoc = Doc<"coachMarkSequences">;
type ProgressDoc = Doc<"coachMarkProgress">;

type TargetType = "element" | "manual" | "hybrid";
type SpotlightShape = "rectangle" | "circle" | "pill";
type ArrowPosition = "top" | "bottom" | "left" | "right" | "none";
type TooltipPosition = "above" | "below" | "left" | "right" | "auto";
type TriggerCondition = "first-login" | "first-visit-page" | "manual";

interface StepFormData {
  stepKey: string;
  name: string;
  description: string;
  pageRoute: string;
  sequenceId: string;
  sequenceOrder: number;
  targetType: TargetType;
  elementSelector: string;
  manualX: number;
  manualY: number;
  manualWidth: number;
  manualHeight: number;
  offsetTop: number;
  offsetLeft: number;
  offsetRight: number;
  offsetBottom: number;
  spotlightShape: SpotlightShape;
  spotlightPadding: number;
  arrowPosition: ArrowPosition;
  arrowOffset: number;
  tooltipText: string;
  tooltipTitle: string;
  tooltipPosition: TooltipPosition;
  isMandatory: boolean;
  allowBackdropClick: boolean;
  showSkipButton: boolean;
  showNextButton: boolean;
  triggerCondition: TriggerCondition;
  isActive: boolean;
}

interface SequenceFormData {
  sequenceId: string;
  name: string;
  description: string;
  isOnboarding: boolean;
  isActive: boolean;
}

const defaultStepForm: StepFormData = {
  stepKey: "",
  name: "",
  description: "",
  pageRoute: "/home",
  sequenceId: "",
  sequenceOrder: 0,
  targetType: "element",
  elementSelector: "",
  manualX: 50,
  manualY: 50,
  manualWidth: 200,
  manualHeight: 100,
  offsetTop: 0,
  offsetLeft: 0,
  offsetRight: 0,
  offsetBottom: 0,
  spotlightShape: "rectangle",
  spotlightPadding: 8,
  arrowPosition: "top",
  arrowOffset: 0,
  tooltipText: "",
  tooltipTitle: "",
  tooltipPosition: "auto",
  isMandatory: true,
  allowBackdropClick: false,
  showSkipButton: false,
  showNextButton: true,
  triggerCondition: "first-login",
  isActive: true,
};

const defaultSequenceForm: SequenceFormData = {
  sequenceId: "",
  name: "",
  description: "",
  isOnboarding: false,
  isActive: true,
};

export default function CoachMarksAdmin() {
  const [activeSubTab, setActiveSubTab] = useState<"steps" | "sequences" | "progress">("steps");
  const [stepForm, setStepForm] = useState<StepFormData>(defaultStepForm);
  const [sequenceForm, setSequenceForm] = useState<SequenceFormData>(defaultSequenceForm);
  const [editingStepId, setEditingStepId] = useState<Id<"coachMarkSteps"> | null>(null);
  const [editingSequenceId, setEditingSequenceId] = useState<Id<"coachMarkSequences"> | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<{ type: "step" | "sequence"; id: string } | null>(null);

  // Queries
  const allSteps = useQuery(api.coachMarksAdmin.getAllSteps);
  const allSequences = useQuery(api.coachMarksAdmin.getAllSequences);
  const allProgress = useQuery(api.coachMarksAdmin.getAllProgress);
  const stats = useQuery(api.coachMarksAdmin.getStats);

  // Mutations
  const createStep = useMutation(api.coachMarksAdmin.createStep);
  const updateStep = useMutation(api.coachMarksAdmin.updateStep);
  const deleteStep = useMutation(api.coachMarksAdmin.deleteStep);
  const createSequence = useMutation(api.coachMarksAdmin.createSequence);
  const updateSequence = useMutation(api.coachMarksAdmin.updateSequence);
  const deleteSequence = useMutation(api.coachMarksAdmin.deleteSequence);
  const resetProgress = useMutation(api.coachMarksAdmin.resetProgress);

  // Auto-clear messages
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  // Handle step form submission
  const handleSaveStep = async () => {
    try {
      const stepData = {
        stepKey: stepForm.stepKey,
        name: stepForm.name,
        description: stepForm.description || undefined,
        pageRoute: stepForm.pageRoute,
        sequenceId: stepForm.sequenceId || undefined,
        sequenceOrder: stepForm.sequenceOrder,
        targetType: stepForm.targetType,
        elementSelector: stepForm.targetType !== "manual" ? stepForm.elementSelector || undefined : undefined,
        manualPosition: stepForm.targetType !== "element" ? {
          x: stepForm.manualX,
          y: stepForm.manualY,
          width: stepForm.manualWidth,
          height: stepForm.manualHeight,
        } : undefined,
        positionOffset: (stepForm.offsetTop || stepForm.offsetLeft || stepForm.offsetRight || stepForm.offsetBottom) ? {
          top: stepForm.offsetTop || undefined,
          left: stepForm.offsetLeft || undefined,
          right: stepForm.offsetRight || undefined,
          bottom: stepForm.offsetBottom || undefined,
        } : undefined,
        spotlightShape: stepForm.spotlightShape,
        spotlightPadding: stepForm.spotlightPadding,
        arrowPosition: stepForm.arrowPosition,
        arrowOffset: stepForm.arrowOffset || undefined,
        tooltipText: stepForm.tooltipText,
        tooltipTitle: stepForm.tooltipTitle || undefined,
        tooltipPosition: stepForm.tooltipPosition,
        isMandatory: stepForm.isMandatory,
        allowBackdropClick: stepForm.allowBackdropClick,
        showSkipButton: stepForm.showSkipButton,
        showNextButton: stepForm.showNextButton,
        triggerCondition: stepForm.triggerCondition,
        isActive: stepForm.isActive,
      };

      if (editingStepId) {
        await updateStep({ id: editingStepId, ...stepData });
        setMessage({ type: "success", text: "Step updated successfully" });
      } else {
        await createStep(stepData);
        setMessage({ type: "success", text: "Step created successfully" });
      }

      setStepForm(defaultStepForm);
      setEditingStepId(null);
    } catch (error: any) {
      setMessage({ type: "error", text: error.message || "Failed to save step" });
    }
  };

  // Handle sequence form submission
  const handleSaveSequence = async () => {
    try {
      const sequenceData = {
        sequenceId: sequenceForm.sequenceId,
        name: sequenceForm.name,
        description: sequenceForm.description || undefined,
        isOnboarding: sequenceForm.isOnboarding,
        isActive: sequenceForm.isActive,
      };

      if (editingSequenceId) {
        await updateSequence({ id: editingSequenceId, ...sequenceData });
        setMessage({ type: "success", text: "Sequence updated successfully" });
      } else {
        await createSequence(sequenceData);
        setMessage({ type: "success", text: "Sequence created successfully" });
      }

      setSequenceForm(defaultSequenceForm);
      setEditingSequenceId(null);
    } catch (error: any) {
      setMessage({ type: "error", text: error.message || "Failed to save sequence" });
    }
  };

  // Edit step
  const handleEditStep = (step: any) => {
    setStepForm({
      stepKey: step.stepKey,
      name: step.name,
      description: step.description || "",
      pageRoute: step.pageRoute,
      sequenceId: step.sequenceId || "",
      sequenceOrder: step.sequenceOrder,
      targetType: step.targetType,
      elementSelector: step.elementSelector || "",
      manualX: step.manualPosition?.x || 50,
      manualY: step.manualPosition?.y || 50,
      manualWidth: step.manualPosition?.width || 200,
      manualHeight: step.manualPosition?.height || 100,
      offsetTop: step.positionOffset?.top || 0,
      offsetLeft: step.positionOffset?.left || 0,
      offsetRight: step.positionOffset?.right || 0,
      offsetBottom: step.positionOffset?.bottom || 0,
      spotlightShape: step.spotlightShape,
      spotlightPadding: step.spotlightPadding,
      arrowPosition: step.arrowPosition,
      arrowOffset: step.arrowOffset || 0,
      tooltipText: step.tooltipText,
      tooltipTitle: step.tooltipTitle || "",
      tooltipPosition: step.tooltipPosition,
      isMandatory: step.isMandatory,
      allowBackdropClick: step.allowBackdropClick,
      showSkipButton: step.showSkipButton,
      showNextButton: step.showNextButton,
      triggerCondition: step.triggerCondition,
      isActive: step.isActive,
    });
    setEditingStepId(step._id);
  };

  // Edit sequence
  const handleEditSequence = (sequence: any) => {
    setSequenceForm({
      sequenceId: sequence.sequenceId,
      name: sequence.name,
      description: sequence.description || "",
      isOnboarding: sequence.isOnboarding,
      isActive: sequence.isActive,
    });
    setEditingSequenceId(sequence._id);
  };

  // Delete handlers
  const handleDeleteStep = async (id: Id<"coachMarkSteps">) => {
    try {
      await deleteStep({ id });
      setMessage({ type: "success", text: "Step deleted" });
      setShowDeleteConfirm(null);
    } catch (error: any) {
      setMessage({ type: "error", text: error.message || "Failed to delete step" });
    }
  };

  const handleDeleteSequence = async (id: Id<"coachMarkSequences">) => {
    try {
      await deleteSequence({ id });
      setMessage({ type: "success", text: "Sequence deleted" });
      setShowDeleteConfirm(null);
    } catch (error: any) {
      setMessage({ type: "error", text: error.message || "Failed to delete sequence" });
    }
  };

  const handleResetProgress = async (corporationId: Id<"corporations">) => {
    try {
      await resetProgress({ corporationId });
      setMessage({ type: "success", text: "Progress reset successfully" });
    } catch (error: any) {
      setMessage({ type: "error", text: error.message || "Failed to reset progress" });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🎯</span>
          <h2 className="text-xl font-bold text-yellow-400 uppercase tracking-wider">Coach Marks System</h2>
        </div>

        {/* Quick Stats */}
        {stats && (
          <div className="flex gap-4 text-sm">
            <div className="px-3 py-1.5 bg-cyan-500/20 rounded-lg border border-cyan-500/30">
              <span className="text-cyan-400">{stats.totalSteps}</span>
              <span className="text-gray-400 ml-1">Steps</span>
            </div>
            <div className="px-3 py-1.5 bg-purple-500/20 rounded-lg border border-purple-500/30">
              <span className="text-purple-400">{stats.totalSequences}</span>
              <span className="text-gray-400 ml-1">Sequences</span>
            </div>
            <div className="px-3 py-1.5 bg-green-500/20 rounded-lg border border-green-500/30">
              <span className="text-green-400">{stats.usersCompleted}</span>
              <span className="text-gray-400 ml-1">Completed</span>
            </div>
          </div>
        )}
      </div>

      {/* Message Display */}
      {message && (
        <div
          className={`p-3 rounded-lg border ${
            message.type === "success"
              ? "bg-green-500/20 border-green-500/30 text-green-400"
              : "bg-red-500/20 border-red-500/30 text-red-400"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Sub-tab Navigation */}
      <div className="flex gap-2 border-b border-gray-700 pb-2">
        {[
          { id: "steps", label: "Tutorial Steps", icon: "📋" },
          { id: "sequences", label: "Sequences", icon: "🔗" },
          { id: "progress", label: "User Progress", icon: "📊" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id as typeof activeSubTab)}
            className={`px-4 py-2 text-sm font-medium uppercase tracking-wider rounded-t-lg transition-all ${
              activeSubTab === tab.id
                ? "bg-yellow-500/20 text-yellow-400 border-b-2 border-yellow-400"
                : "text-gray-400 hover:text-gray-300 hover:bg-white/5"
            }`}
          >
            <span className="mr-2">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* STEPS TAB */}
      {activeSubTab === "steps" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Step Form */}
          <div className="bg-gray-800/50 rounded-lg border border-gray-700 p-6">
            <h3 className="text-lg font-bold text-white mb-4">
              {editingStepId ? "Edit Step" : "Create New Step"}
            </h3>

            <div className="space-y-4">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-400 uppercase tracking-wider mb-1">Step Key</label>
                  <input
                    type="text"
                    value={stepForm.stepKey}
                    onChange={(e) => setStepForm({ ...stepForm, stepKey: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white text-sm focus:border-cyan-500 focus:outline-none"
                    placeholder="onboard-forge-button"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 uppercase tracking-wider mb-1">Name</label>
                  <input
                    type="text"
                    value={stepForm.name}
                    onChange={(e) => setStepForm({ ...stepForm, name: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white text-sm focus:border-cyan-500 focus:outline-none"
                    placeholder="Click the Forge button"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-400 uppercase tracking-wider mb-1">Description (Admin)</label>
                <input
                  type="text"
                  value={stepForm.description}
                  onChange={(e) => setStepForm({ ...stepForm, description: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white text-sm focus:border-cyan-500 focus:outline-none"
                  placeholder="Optional admin notes"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-400 uppercase tracking-wider mb-1">Page Route</label>
                  <input
                    type="text"
                    value={stepForm.pageRoute}
                    onChange={(e) => setStepForm({ ...stepForm, pageRoute: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white text-sm focus:border-cyan-500 focus:outline-none"
                    placeholder="/home"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 uppercase tracking-wider mb-1">Trigger</label>
                  <select
                    value={stepForm.triggerCondition}
                    onChange={(e) => setStepForm({ ...stepForm, triggerCondition: e.target.value as TriggerCondition })}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white text-sm focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="first-login">First Login</option>
                    <option value="first-visit-page">First Page Visit</option>
                    <option value="manual">Manual Trigger</option>
                  </select>
                </div>
              </div>

              {/* Sequence Assignment */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-400 uppercase tracking-wider mb-1">Sequence</label>
                  <select
                    value={stepForm.sequenceId}
                    onChange={(e) => setStepForm({ ...stepForm, sequenceId: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white text-sm focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="">No Sequence</option>
                    {allSequences?.map((seq: SequenceDoc) => (
                      <option key={seq._id} value={seq.sequenceId}>
                        {seq.name} ({seq.sequenceId})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 uppercase tracking-wider mb-1">Order in Sequence</label>
                  <input
                    type="number"
                    value={stepForm.sequenceOrder}
                    onChange={(e) => setStepForm({ ...stepForm, sequenceOrder: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white text-sm focus:border-cyan-500 focus:outline-none"
                    min="0"
                  />
                </div>
              </div>

              {/* Target Type */}
              <div>
                <label className="block text-xs text-gray-400 uppercase tracking-wider mb-1">Target Type</label>
                <div className="flex gap-2">
                  {(["element", "manual", "hybrid"] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => setStepForm({ ...stepForm, targetType: type })}
                      className={`px-4 py-2 text-sm uppercase tracking-wider rounded-lg border transition-all ${
                        stepForm.targetType === type
                          ? "bg-cyan-500/20 border-cyan-500 text-cyan-400"
                          : "bg-gray-800 border-gray-600 text-gray-400 hover:border-gray-500"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Element Selector (for element/hybrid) */}
              {stepForm.targetType !== "manual" && (
                <div>
                  <label className="block text-xs text-gray-400 uppercase tracking-wider mb-1">Element Selector</label>
                  <input
                    type="text"
                    value={stepForm.elementSelector}
                    onChange={(e) => setStepForm({ ...stepForm, elementSelector: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white text-sm focus:border-cyan-500 focus:outline-none font-mono"
                    placeholder="[data-tutorial='forge-button']"
                  />
                </div>
              )}

              {/* Manual Position (for manual/hybrid) */}
              {stepForm.targetType !== "element" && (
                <div className="grid grid-cols-4 gap-2">
                  <div>
                    <label className="block text-xs text-gray-400 uppercase tracking-wider mb-1">X %</label>
                    <input
                      type="number"
                      value={stepForm.manualX}
                      onChange={(e) => setStepForm({ ...stepForm, manualX: parseFloat(e.target.value) || 0 })}
                      className="w-full px-2 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white text-sm focus:border-cyan-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 uppercase tracking-wider mb-1">Y %</label>
                    <input
                      type="number"
                      value={stepForm.manualY}
                      onChange={(e) => setStepForm({ ...stepForm, manualY: parseFloat(e.target.value) || 0 })}
                      className="w-full px-2 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white text-sm focus:border-cyan-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 uppercase tracking-wider mb-1">Width</label>
                    <input
                      type="number"
                      value={stepForm.manualWidth}
                      onChange={(e) => setStepForm({ ...stepForm, manualWidth: parseFloat(e.target.value) || 0 })}
                      className="w-full px-2 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white text-sm focus:border-cyan-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 uppercase tracking-wider mb-1">Height</label>
                    <input
                      type="number"
                      value={stepForm.manualHeight}
                      onChange={(e) => setStepForm({ ...stepForm, manualHeight: parseFloat(e.target.value) || 0 })}
                      className="w-full px-2 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white text-sm focus:border-cyan-500 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Visual Settings */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-gray-400 uppercase tracking-wider mb-1">Shape</label>
                  <select
                    value={stepForm.spotlightShape}
                    onChange={(e) => setStepForm({ ...stepForm, spotlightShape: e.target.value as SpotlightShape })}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white text-sm focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="rectangle">Rectangle</option>
                    <option value="circle">Circle</option>
                    <option value="pill">Pill</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 uppercase tracking-wider mb-1">Padding</label>
                  <input
                    type="number"
                    value={stepForm.spotlightPadding}
                    onChange={(e) => setStepForm({ ...stepForm, spotlightPadding: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white text-sm focus:border-cyan-500 focus:outline-none"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 uppercase tracking-wider mb-1">Arrow</label>
                  <select
                    value={stepForm.arrowPosition}
                    onChange={(e) => setStepForm({ ...stepForm, arrowPosition: e.target.value as ArrowPosition })}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white text-sm focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="top">Top</option>
                    <option value="bottom">Bottom</option>
                    <option value="left">Left</option>
                    <option value="right">Right</option>
                    <option value="none">None</option>
                  </select>
                </div>
              </div>

              {/* Tooltip Content */}
              <div>
                <label className="block text-xs text-gray-400 uppercase tracking-wider mb-1">Tooltip Title (Optional)</label>
                <input
                  type="text"
                  value={stepForm.tooltipTitle}
                  onChange={(e) => setStepForm({ ...stepForm, tooltipTitle: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white text-sm focus:border-cyan-500 focus:outline-none"
                  placeholder="Welcome!"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 uppercase tracking-wider mb-1">Tooltip Text</label>
                <textarea
                  value={stepForm.tooltipText}
                  onChange={(e) => setStepForm({ ...stepForm, tooltipText: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white text-sm focus:border-cyan-500 focus:outline-none resize-none"
                  rows={3}
                  placeholder="Click here to start forging your Meks!"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-400 uppercase tracking-wider mb-1">Tooltip Position</label>
                <select
                  value={stepForm.tooltipPosition}
                  onChange={(e) => setStepForm({ ...stepForm, tooltipPosition: e.target.value as TooltipPosition })}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white text-sm focus:border-cyan-500 focus:outline-none"
                >
                  <option value="auto">Auto</option>
                  <option value="above">Above</option>
                  <option value="below">Below</option>
                  <option value="left">Left</option>
                  <option value="right">Right</option>
                </select>
              </div>

              {/* Behavior Toggles */}
              <div className="grid grid-cols-2 gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={stepForm.isMandatory}
                    onChange={(e) => setStepForm({ ...stepForm, isMandatory: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-600 bg-gray-900 text-cyan-500 focus:ring-cyan-500"
                  />
                  <span className="text-sm text-gray-300">Mandatory</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={stepForm.allowBackdropClick}
                    onChange={(e) => setStepForm({ ...stepForm, allowBackdropClick: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-600 bg-gray-900 text-cyan-500 focus:ring-cyan-500"
                  />
                  <span className="text-sm text-gray-300">Allow Backdrop Click</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={stepForm.showSkipButton}
                    onChange={(e) => setStepForm({ ...stepForm, showSkipButton: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-600 bg-gray-900 text-cyan-500 focus:ring-cyan-500"
                  />
                  <span className="text-sm text-gray-300">Show Skip Button</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={stepForm.showNextButton}
                    onChange={(e) => setStepForm({ ...stepForm, showNextButton: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-600 bg-gray-900 text-cyan-500 focus:ring-cyan-500"
                  />
                  <span className="text-sm text-gray-300">Show Next Button</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={stepForm.isActive}
                    onChange={(e) => setStepForm({ ...stepForm, isActive: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-600 bg-gray-900 text-cyan-500 focus:ring-cyan-500"
                  />
                  <span className="text-sm text-gray-300">Active</span>
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-gray-700">
                <button
                  onClick={handleSaveStep}
                  className="flex-1 px-4 py-2 bg-cyan-500/20 border border-cyan-500/50 text-cyan-400 rounded-lg text-sm font-medium uppercase tracking-wider hover:bg-cyan-500/30 transition-colors"
                >
                  {editingStepId ? "Update Step" : "Create Step"}
                </button>
                {editingStepId && (
                  <button
                    onClick={() => {
                      setStepForm(defaultStepForm);
                      setEditingStepId(null);
                    }}
                    className="px-4 py-2 bg-gray-700 border border-gray-600 text-gray-300 rounded-lg text-sm font-medium uppercase tracking-wider hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Steps List */}
          <div className="bg-gray-800/50 rounded-lg border border-gray-700 p-6">
            <h3 className="text-lg font-bold text-white mb-4">All Steps ({allSteps?.length || 0})</h3>

            <div className="space-y-2 max-h-[700px] overflow-y-auto">
              {allSteps?.map((step: StepDoc) => (
                <div
                  key={step._id}
                  className={`p-3 rounded-lg border transition-all ${
                    step.isActive
                      ? "bg-gray-700/50 border-gray-600"
                      : "bg-gray-800/50 border-gray-700 opacity-60"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-white font-medium truncate">{step.name}</span>
                        {!step.isActive && (
                          <span className="px-1.5 py-0.5 bg-gray-600 text-gray-400 text-xs rounded">Inactive</span>
                        )}
                      </div>
                      <div className="text-xs text-gray-400 font-mono truncate">{step.stepKey}</div>
                      <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                        <span>{step.pageRoute}</span>
                        <span>•</span>
                        <span>{step.targetType}</span>
                        {step.sequenceId && (
                          <>
                            <span>•</span>
                            <span className="text-purple-400">{step.sequenceId}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleEditStep(step)}
                        className="px-2 py-1 text-xs text-cyan-400 hover:bg-cyan-500/20 rounded transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm({ type: "step", id: step._id })}
                        className="px-2 py-1 text-xs text-red-400 hover:bg-red-500/20 rounded transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {(!allSteps || allSteps.length === 0) && (
                <div className="text-center text-gray-500 py-8">
                  No steps created yet. Create your first tutorial step!
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SEQUENCES TAB */}
      {activeSubTab === "sequences" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sequence Form */}
          <div className="bg-gray-800/50 rounded-lg border border-gray-700 p-6">
            <h3 className="text-lg font-bold text-white mb-4">
              {editingSequenceId ? "Edit Sequence" : "Create New Sequence"}
            </h3>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-400 uppercase tracking-wider mb-1">Sequence ID</label>
                  <input
                    type="text"
                    value={sequenceForm.sequenceId}
                    onChange={(e) => setSequenceForm({ ...sequenceForm, sequenceId: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white text-sm focus:border-cyan-500 focus:outline-none"
                    placeholder="onboarding-tour"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 uppercase tracking-wider mb-1">Name</label>
                  <input
                    type="text"
                    value={sequenceForm.name}
                    onChange={(e) => setSequenceForm({ ...sequenceForm, name: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white text-sm focus:border-cyan-500 focus:outline-none"
                    placeholder="New User Onboarding"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-400 uppercase tracking-wider mb-1">Description</label>
                <input
                  type="text"
                  value={sequenceForm.description}
                  onChange={(e) => setSequenceForm({ ...sequenceForm, description: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white text-sm focus:border-cyan-500 focus:outline-none"
                  placeholder="Guides new users through basic features"
                />
              </div>

              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sequenceForm.isOnboarding}
                    onChange={(e) => setSequenceForm({ ...sequenceForm, isOnboarding: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-600 bg-gray-900 text-cyan-500 focus:ring-cyan-500"
                  />
                  <span className="text-sm text-gray-300">Is Onboarding Sequence</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sequenceForm.isActive}
                    onChange={(e) => setSequenceForm({ ...sequenceForm, isActive: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-600 bg-gray-900 text-cyan-500 focus:ring-cyan-500"
                  />
                  <span className="text-sm text-gray-300">Active</span>
                </label>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-700">
                <button
                  onClick={handleSaveSequence}
                  className="flex-1 px-4 py-2 bg-purple-500/20 border border-purple-500/50 text-purple-400 rounded-lg text-sm font-medium uppercase tracking-wider hover:bg-purple-500/30 transition-colors"
                >
                  {editingSequenceId ? "Update Sequence" : "Create Sequence"}
                </button>
                {editingSequenceId && (
                  <button
                    onClick={() => {
                      setSequenceForm(defaultSequenceForm);
                      setEditingSequenceId(null);
                    }}
                    className="px-4 py-2 bg-gray-700 border border-gray-600 text-gray-300 rounded-lg text-sm font-medium uppercase tracking-wider hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Sequences List */}
          <div className="bg-gray-800/50 rounded-lg border border-gray-700 p-6">
            <h3 className="text-lg font-bold text-white mb-4">All Sequences ({allSequences?.length || 0})</h3>

            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {allSequences?.map((seq: SequenceDoc) => (
                <div
                  key={seq._id}
                  className={`p-4 rounded-lg border transition-all ${
                    seq.isActive
                      ? "bg-gray-700/50 border-gray-600"
                      : "bg-gray-800/50 border-gray-700 opacity-60"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-white font-medium">{seq.name}</span>
                        {seq.isOnboarding && (
                          <span className="px-1.5 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded">Onboarding</span>
                        )}
                        {!seq.isActive && (
                          <span className="px-1.5 py-0.5 bg-gray-600 text-gray-400 text-xs rounded">Inactive</span>
                        )}
                      </div>
                      <div className="text-xs text-gray-400 font-mono">{seq.sequenceId}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {seq.stepOrder.length} steps: {seq.stepOrder.join(" → ")}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleEditSequence(seq)}
                        className="px-2 py-1 text-xs text-purple-400 hover:bg-purple-500/20 rounded transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm({ type: "sequence", id: seq._id })}
                        className="px-2 py-1 text-xs text-red-400 hover:bg-red-500/20 rounded transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {(!allSequences || allSequences.length === 0) && (
                <div className="text-center text-gray-500 py-8">
                  No sequences created yet. Create a sequence to group tutorial steps!
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* PROGRESS TAB */}
      {activeSubTab === "progress" && (
        <div className="bg-gray-800/50 rounded-lg border border-gray-700 p-6">
          <h3 className="text-lg font-bold text-white mb-4">User Tutorial Progress</h3>

          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {allProgress?.map((progress: ProgressDoc) => (
              <div
                key={progress._id}
                className="p-4 rounded-lg border border-gray-600 bg-gray-700/30"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-mono text-sm">{progress.corporationId}</span>
                      {progress.tutorialCompleted && (
                        <span className="px-1.5 py-0.5 bg-green-500/20 text-green-400 text-xs rounded">Completed</span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-2 text-xs text-gray-400">
                      <div>
                        <span className="text-gray-500">Completed:</span>{" "}
                        <span className="text-green-400">{progress.completedSteps.length}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Skipped:</span>{" "}
                        <span className="text-yellow-400">{progress.skippedSteps.length}</span>
                      </div>
                      {progress.currentSequence && (
                        <div className="col-span-2">
                          <span className="text-gray-500">In progress:</span>{" "}
                          <span className="text-purple-400">{progress.currentSequence}</span>
                          <span className="text-gray-500"> (step {(progress.currentStepIndex ?? 0) + 1})</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleResetProgress(progress.corporationId)}
                    className="px-3 py-1.5 text-xs text-red-400 border border-red-500/30 rounded hover:bg-red-500/20 transition-colors"
                  >
                    Reset
                  </button>
                </div>
              </div>
            ))}

            {(!allProgress || allProgress.length === 0) && (
              <div className="text-center text-gray-500 py-8">
                No user progress recorded yet.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={() => setShowDeleteConfirm(null)}>
          <div
            className="bg-gray-800 border border-gray-600 rounded-lg p-6 max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <h4 className="text-lg font-bold text-white mb-2">Confirm Delete</h4>
            <p className="text-gray-400 mb-4">
              Are you sure you want to delete this {showDeleteConfirm.type}? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (showDeleteConfirm.type === "step") {
                    handleDeleteStep(showDeleteConfirm.id as Id<"coachMarkSteps">);
                  } else {
                    handleDeleteSequence(showDeleteConfirm.id as Id<"coachMarkSequences">);
                  }
                }}
                className="px-4 py-2 bg-red-500/20 border border-red-500/50 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
