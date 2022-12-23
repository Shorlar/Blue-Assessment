import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { AnswerQuestionComand } from './comand';
import { Logger, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Answer, Question } from '../../entities';
import { Repository } from 'typeorm';
import { ErrorMessages } from '../../shared';

@CommandHandler(AnswerQuestionComand)
export class AnswerQuestionComandHandler
  implements ICommandHandler<AnswerQuestionComand>
{
  private logger: Logger;
  constructor(
    @InjectRepository(Answer)
    private answerRepository: Repository<Answer>,
    @InjectRepository(Question)
    private questionRepository: Repository<Question>,
  ) {
    this.logger = new Logger(AnswerQuestionComand.name);
  }

  async execute(command: AnswerQuestionComand): Promise<any> {
    this.logger.log(`In ${AnswerQuestionComandHandler.name}`);
    const {
      body: { questionId, answer },
      user,
    } = command;
    let question: Question = null;
    try {
      question = await this.questionRepository.findOne({
        where: { id: questionId },
      });
    } catch (error) {
      this.logger.log(`Error: ${error}`);
      throw new HttpException(
        ErrorMessages.DATABASE_ERROR,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
    if (!question) {
      throw new HttpException('Invalid Question ID', HttpStatus.BAD_REQUEST);
    }
    const answerObject = {
      userDisplayName: user.displayName,
      user,
      question,
      answerBody: answer,
    };
    try {
      await this.answerRepository.save(answerObject);
      this.logger.log('Done saving answer');
      return 'Successful';
    } catch (error) {
      this.logger.log(`Error: ${error}`);
      throw new HttpException(
        ErrorMessages.DATABASE_ERROR,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}