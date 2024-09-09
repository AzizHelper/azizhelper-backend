import { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';
export function validateData(schema: z.ZodObject<any, any>) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const combinedData = { ...req.body, ...req.params, ...req.query };
      schema.parse(combinedData)
      next()
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessages = error.errors.map((issue: any) => ({
          message: `${issue.path.join('.')} is ${issue.message}`,
        }))
        res.status(422).json({ message: "Invalid data", details: errorMessages })
      } else {
        res.status(500).json({ message: "Internal Server Error" })
      }
    }
  }
}
