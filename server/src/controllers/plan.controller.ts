import { Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth.middleware';

export const getAllPlans = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const plans = await prisma.businessPlan.findMany({
      orderBy: { createdAt: 'desc' },
    });

    // Parse JSON strings for goals and tasks
    const parsedPlans = plans.map(plan => ({
      ...plan,
      goals: plan.goals ? JSON.parse(plan.goals) : [],
      tasks: plan.tasks ? JSON.parse(plan.tasks) : [],
    }));

    res.json({ plans: parsedPlans });
  } catch (error) {
    next(error);
  }
};

export const getPlanById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const plan = await prisma.businessPlan.findUnique({
      where: { id: req.params.id },
    });

    if (!plan) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    // Parse JSON strings for goals and tasks
    const parsedPlan = {
      ...plan,
      goals: plan.goals ? JSON.parse(plan.goals) : [],
      tasks: plan.tasks ? JSON.parse(plan.tasks) : [],
    };

    res.json({ plan: parsedPlan });
  } catch (error) {
    next(error);
  }
};

export const createPlan = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { goals, tasks, id, createdAt, updatedAt, ...planData } = req.body;
    
    console.log('Creating plan with data:', {
      ...planData,
      userId: req.user!.id,
      goalsCount: goals?.length || 0,
      tasksCount: tasks?.length || 0,
    });
    
    const plan = await prisma.businessPlan.create({
      data: {
        ...planData,
        userId: req.user!.id,
        goals: goals ? JSON.stringify(goals) : '[]',
        tasks: tasks ? JSON.stringify(tasks) : '[]',
      },
    });

    // Return with parsed goals and tasks
    const parsedPlan = {
      ...plan,
      goals: plan.goals ? JSON.parse(plan.goals) : [],
      tasks: plan.tasks ? JSON.parse(plan.tasks) : [],
    };

    res.status(201).json({ plan: parsedPlan });
  } catch (error) {
    console.error('Error creating plan:', error);
    next(error);
  }
};

export const updatePlan = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { goals, tasks, ...planData } = req.body;
    
    const plan = await prisma.businessPlan.update({
      where: { id: req.params.id },
      data: {
        ...planData,
        goals: goals ? JSON.stringify(goals) : undefined,
        tasks: tasks ? JSON.stringify(tasks) : undefined,
      },
    });

    // Return with parsed goals and tasks
    const parsedPlan = {
      ...plan,
      goals: plan.goals ? JSON.parse(plan.goals) : [],
      tasks: plan.tasks ? JSON.parse(plan.tasks) : [],
    };

    res.json({ plan: parsedPlan });
  } catch (error) {
    next(error);
  }
};

export const deletePlan = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await prisma.businessPlan.delete({
      where: { id: req.params.id },
    });

    res.json({ message: 'Plan deleted successfully' });
  } catch (error) {
    next(error);
  }
};
