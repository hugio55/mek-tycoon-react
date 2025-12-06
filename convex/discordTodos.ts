/**
 * Discord Todo List Management
 * Replaces file-based storage with Convex database for persistence across deployments
 */

import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const GLOBAL_TODO_KEY = 'global';

/**
 * Get or initialize todo data
 */
export const getTodoData = query({
  args: {},
  handler: async (ctx) => {
    const todoDoc = await ctx.db
      .query("discordTodos")
      .withIndex("by_key", q => q.eq("key", GLOBAL_TODO_KEY))
      .first();

    if (!todoDoc) {
      // Return default structure if no todo exists yet
      return {
        key: GLOBAL_TODO_KEY,
        messageId: undefined,
        channelId: undefined,
        tasks: [],
        page: 1,
        mode: 'view',
        updatedAt: Date.now(),
      };
    }

    return todoDoc;
  }
});

/**
 * Initialize or update todo data structure
 */
export const ensureTodoExists = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db
      .query("discordTodos")
      .withIndex("by_key", q => q.eq("key", GLOBAL_TODO_KEY))
      .first();

    if (!existing) {
      await ctx.db.insert("discordTodos", {
        key: GLOBAL_TODO_KEY,
        tasks: [],
        page: 1,
        mode: 'view',
        updatedAt: Date.now(),
      });
    }
  }
});

/**
 * Add a new task
 */
export const addTask = mutation({
  args: {
    text: v.string(),
  },
  handler: async (ctx, args) => {
    // Ensure todo doc exists
    let todoDoc = await ctx.db
      .query("discordTodos")
      .withIndex("by_key", q => q.eq("key", GLOBAL_TODO_KEY))
      .first();

    if (!todoDoc) {
      const newDocId = await ctx.db.insert("discordTodos", {
        key: GLOBAL_TODO_KEY,
        tasks: [],
        page: 1,
        mode: 'view',
        updatedAt: Date.now(),
      });
      todoDoc = await ctx.db.get(newDocId);
      if (!todoDoc) throw new Error("Failed to create todo doc");
    }

    const newTask = {
      id: todoDoc.tasks.length > 0 ? Math.max(...todoDoc.tasks.map((t: any) => t.id)) + 1 : 1,
      text: args.text,
      completed: false,
      createdAt: Date.now(),
    };

    const updatedTasks = [...todoDoc.tasks, newTask];

    await ctx.db.patch(todoDoc._id, {
      tasks: updatedTasks,
      updatedAt: Date.now(),
    });

    return newTask;
  }
});

/**
 * Toggle task completion status
 */
export const toggleTask = mutation({
  args: {
    taskNumber: v.number(),
  },
  handler: async (ctx, args) => {
    const todoDoc = await ctx.db
      .query("discordTodos")
      .withIndex("by_key", q => q.eq("key", GLOBAL_TODO_KEY))
      .first();

    if (!todoDoc) throw new Error("Todo doc not found");
    if (args.taskNumber < 1 || args.taskNumber > todoDoc.tasks.length) {
      throw new Error("Invalid task number");
    }

    const taskIndex = args.taskNumber - 1;
    const updatedTasks = [...todoDoc.tasks];
    updatedTasks[taskIndex] = {
      ...updatedTasks[taskIndex],
      completed: !updatedTasks[taskIndex].completed,
    };

    await ctx.db.patch(todoDoc._id, {
      tasks: updatedTasks,
      updatedAt: Date.now(),
    });

    return updatedTasks[taskIndex];
  }
});

/**
 * Delete a task
 */
export const deleteTask = mutation({
  args: {
    taskNumber: v.number(),
  },
  handler: async (ctx, args) => {
    const todoDoc = await ctx.db
      .query("discordTodos")
      .withIndex("by_key", q => q.eq("key", GLOBAL_TODO_KEY))
      .first();

    if (!todoDoc) throw new Error("Todo doc not found");
    if (args.taskNumber < 1 || args.taskNumber > todoDoc.tasks.length) {
      throw new Error("Invalid task number");
    }

    const taskIndex = args.taskNumber - 1;
    const deletedTask = todoDoc.tasks[taskIndex];
    const updatedTasks = todoDoc.tasks.filter((_, index) => index !== taskIndex);

    await ctx.db.patch(todoDoc._id, {
      tasks: updatedTasks,
      updatedAt: Date.now(),
    });

    return deletedTask;
  }
});

/**
 * Edit a task's text
 */
export const editTask = mutation({
  args: {
    taskNumber: v.number(),
    newText: v.string(),
  },
  handler: async (ctx, args) => {
    const todoDoc = await ctx.db
      .query("discordTodos")
      .withIndex("by_key", q => q.eq("key", GLOBAL_TODO_KEY))
      .first();

    if (!todoDoc) throw new Error("Todo doc not found");
    if (args.taskNumber < 1 || args.taskNumber > todoDoc.tasks.length) {
      throw new Error("Invalid task number");
    }

    const taskIndex = args.taskNumber - 1;
    const updatedTasks = [...todoDoc.tasks];
    updatedTasks[taskIndex] = {
      ...updatedTasks[taskIndex],
      text: args.newText,
    };

    await ctx.db.patch(todoDoc._id, {
      tasks: updatedTasks,
      updatedAt: Date.now(),
    });

    return updatedTasks[taskIndex];
  }
});

/**
 * Clear all completed tasks
 */
export const clearCompleted = mutation({
  args: {},
  handler: async (ctx) => {
    const todoDoc = await ctx.db
      .query("discordTodos")
      .withIndex("by_key", q => q.eq("key", GLOBAL_TODO_KEY))
      .first();

    if (!todoDoc) throw new Error("Todo doc not found");

    const incompleteTasks = todoDoc.tasks.filter((task: any) => !task.completed);
    const clearedCount = todoDoc.tasks.length - incompleteTasks.length;

    await ctx.db.patch(todoDoc._id, {
      tasks: incompleteTasks,
      updatedAt: Date.now(),
    });

    return clearedCount;
  }
});

/**
 * Set mode (view, complete, uncomplete, delete)
 */
export const setMode = mutation({
  args: {
    mode: v.string(),
  },
  handler: async (ctx, args) => {
    const todoDoc = await ctx.db
      .query("discordTodos")
      .withIndex("by_key", q => q.eq("key", GLOBAL_TODO_KEY))
      .first();

    if (!todoDoc) throw new Error("Todo doc not found");

    await ctx.db.patch(todoDoc._id, {
      mode: args.mode,
      updatedAt: Date.now(),
    });
  }
});

/**
 * Set current page
 */
export const setPage = mutation({
  args: {
    page: v.number(),
  },
  handler: async (ctx, args) => {
    const todoDoc = await ctx.db
      .query("discordTodos")
      .withIndex("by_key", q => q.eq("key", GLOBAL_TODO_KEY))
      .first();

    if (!todoDoc) throw new Error("Todo doc not found");

    await ctx.db.patch(todoDoc._id, {
      page: args.page,
      updatedAt: Date.now(),
    });
  }
});

/**
 * Set message info for updating the Discord message
 */
export const setMessageInfo = mutation({
  args: {
    messageId: v.string(),
    channelId: v.string(),
  },
  handler: async (ctx, args) => {
    // Ensure todo doc exists
    let todoDoc = await ctx.db
      .query("discordTodos")
      .withIndex("by_key", q => q.eq("key", GLOBAL_TODO_KEY))
      .first();

    if (!todoDoc) {
      const newDocId = await ctx.db.insert("discordTodos", {
        key: GLOBAL_TODO_KEY,
        tasks: [],
        page: 1,
        mode: 'view',
        updatedAt: Date.now(),
      });
      todoDoc = await ctx.db.get(newDocId);
      if (!todoDoc) throw new Error("Failed to create todo doc");
    }

    await ctx.db.patch(todoDoc._id, {
      messageId: args.messageId,
      channelId: args.channelId,
      updatedAt: Date.now(),
    });
  }
});
