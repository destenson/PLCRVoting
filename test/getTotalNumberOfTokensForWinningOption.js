/* eslint-env mocha */
/* global contract assert */

const utils = require('./utils.js');

contract('PLCRVoting', (accounts) => {
  const [alice, bob, cat] = accounts;

  describe('Function: getTotalNumberOfTokensForWinningOption', () => {
    it('should return the total number of votes for if the poll passed', async () => {
      const plcr = await utils.getPLCRInstance();
      const token = await utils.getERC20Token();
      const options = utils.defaultOptions();
      options.actor = alice;
      options.numTokens = '40';

      const startingBalance = await token.balanceOf.call(alice);
      const pollID = await utils.startPollAndCommitVote(options);

      await utils.increaseTime(101);

      await utils.as(alice, plcr.revealVote, pollID, options.vote, options.salt);

      await utils.increaseTime(101);

      const totalNumTokensForWinning = await utils.as(
        alice, plcr.getTotalNumberOfTokensForWinningOption, pollID,
      );

      assert.strictEqual(
        totalNumTokensForWinning.toString(10),
        '40',
        'should have returned the correct numTokens',
      );

      const endBalance = await token.balanceOf.call(alice);
      assert.strictEqual(
        endBalance.toString(10),
        startingBalance.sub(options.votingRights).toString(10),
        'should have 50 less tokens because of voting rights',
      );
    });

    it('should return the total number of votes against if the poll did not pass', async () => {
      const plcr = await utils.getPLCRInstance();
      const token = await utils.getERC20Token();
      const options = utils.defaultOptions();
      options.actor = alice;
      options.numTokens = '40';

      const startingBalance = await token.balanceOf.call(alice);
      const pollID = await utils.startPollAndCommitVote(options);
      await utils.commitVote(pollID, '0', '60', '9000', bob);
      await utils.increaseTime(101);

      await utils.as(alice, plcr.revealVote, pollID, options.vote, options.salt);
      await utils.as(bob, plcr.revealVote, pollID, '0', '9000');
      await utils.increaseTime(101);

      const totalNumTokensForWinning = await utils.as(
        alice, plcr.getTotalNumberOfTokensForWinningOption, pollID,
      );

      assert.strictEqual(
        totalNumTokensForWinning.toString(10),
        '60',
        'should have returned bobs numTokens',
      );

      const endBalance = await token.balanceOf.call(alice);
      assert.strictEqual(
        endBalance.toString(10),
        startingBalance.sub(options.votingRights).toString(10),
        'should have 50 less tokens because of voting rights',
      );
    });

    it('should fail if the poll has not yet ended', async () => {
      const plcr = await utils.getPLCRInstance();
      const token = await utils.getERC20Token();
      const options = utils.defaultOptions();
      options.actor = cat;
      options.numTokens = '40';

      const startingBalance = await token.balanceOf.call(cat);
      const pollID = await utils.startPollAndCommitVote(options);
      await utils.increaseTime(101);

      try {
        await utils.as(
          cat, plcr.getTotalNumberOfTokensForWinningOption, pollID,
        );
        assert(false, 'should have failed');
      } catch (err) {
        assert(
          utils.isEVMException(err), 'should have failed',
        );
      }

      const endBalance = await token.balanceOf.call(cat);
      assert.strictEqual(
        endBalance.toString(10),
        startingBalance.sub(options.votingRights).toString(10),
        'should have 50 less tokens because of voting rights',
      );
    });
  });
});
