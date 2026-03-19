use cosmwasm_std::{
    entry_point, Binary, Deps, DepsMut, Env, MessageInfo, Response, StdResult, Uint128,
    to_binary,
};
use serde::{Deserialize, Serialize};

// ==================== STATE ====================

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Config {
    pub creator: String,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct GameStake {
    pub player: String,
    pub game_id: u64,
    pub outcome: u32,
    pub amount: Uint128,
}

// ==================== MESSAGES ====================

#[derive(Serialize, Deserialize)]
pub struct InstantiateMsg {
    pub name: String,
}

#[derive(Serialize, Deserialize)]
pub enum ExecuteMsg {
    PlaceStake {
        game_id: u64,
        outcome: u32,
    },
    FinalizeGame {
        game_id: u64,
        winning_outcome: u32,
    },
}

#[derive(Serialize, Deserialize)]
pub enum QueryMsg {
    GetGameInfo { game_id: u64 },
    GetPlayerStake { game_id: u64, player: String },
}

#[derive(Serialize, Deserialize)]
pub struct GameInfo {
    pub game_id: u64,
    pub pool_total: Uint128,
    pub winner_outcome: u32,
}

// ==================== INSTANTIATE ====================

#[entry_point]
pub fn instantiate(
    deps: cosmwasm_std::DepsMut,
    _env: Env,
    info: MessageInfo,
    msg: InstantiateMsg,
) -> StdResult<Response> {
    let config = Config {
        creator: info.sender.to_string(),
    };

    deps.storage.set(b"config", &cosmwasm_std::to_vec(&config)?);

    Ok(Response::new()
        .add_attribute("action", "instantiate")
        .add_attribute("name", msg.name)
        .add_attribute("creator", info.sender))
}

// ==================== EXECUTE ====================

#[entry_point]
pub fn execute(
    deps: DepsMut,
    _env: Env,
    info: MessageInfo,
    msg: ExecuteMsg,
) -> StdResult<Response> {
    match msg {
        ExecuteMsg::PlaceStake { game_id, outcome } => {
            place_stake(deps, info, game_id, outcome)
        }
        ExecuteMsg::FinalizeGame {
            game_id,
            winning_outcome,
        } => finalize_game(deps, game_id, winning_outcome),
    }
}

fn place_stake(
    deps: DepsMut,
    info: MessageInfo,
    game_id: u64,
    outcome: u32,
) -> StdResult<Response> {
    let amount = info
        .funds
        .iter()
        .find(|c| c.denom == "inj")
        .map(|c| c.amount)
        .unwrap_or_else(Uint128::zero);

    let stake_key = format!("stake:{}:{}", game_id, info.sender);
    let stake = GameStake {
        player: info.sender.to_string(),
        game_id,
        outcome,
        amount,
    };

    deps.storage
        .set(stake_key.as_bytes(), &cosmwasm_std::to_vec(&stake)?);

    Ok(Response::new()
        .add_attribute("action", "place_stake")
        .add_attribute("player", info.sender)
        .add_attribute("game_id", game_id.to_string())
        .add_attribute("outcome", outcome.to_string())
        .add_attribute("amount", amount.to_string()))
}

fn finalize_game(
    deps: DepsMut,
    game_id: u64,
    winning_outcome: u32,
) -> StdResult<Response> {
    let winner_key = format!("winner:{}", game_id);
    deps.storage
        .set(winner_key.as_bytes(), &cosmwasm_std::to_vec(&winning_outcome)?);

    Ok(Response::new()
        .add_attribute("action", "finalize_game")
        .add_attribute("game_id", game_id.to_string())
        .add_attribute("winning_outcome", winning_outcome.to_string()))
}

// ==================== QUERY ====================

#[entry_point]
pub fn query(deps: Deps, _env: Env, msg: QueryMsg) -> StdResult<Binary> {
    match msg {
        QueryMsg::GetGameInfo { game_id } => get_game_info(deps, game_id),
        QueryMsg::GetPlayerStake { game_id, player } => {
            get_player_stake(deps, game_id, player)
        }
    }
}

fn get_game_info(deps: Deps, game_id: u64) -> StdResult<Binary> {
    let winner_key = format!("winner:{}", game_id);
    let winning_outcome: u32 = deps
        .storage
        .get(winner_key.as_bytes())
        .and_then(|b| cosmwasm_std::from_slice(&b).ok())
        .unwrap_or(0);

    let info = GameInfo {
        game_id,
        pool_total: Uint128::zero(),
        winner_outcome: winning_outcome,
    };

    to_binary(&info)
}

fn get_player_stake(
    deps: Deps,
    game_id: u64,
    player: String,
) -> StdResult<Binary> {
    let stake_key = format!("stake:{}:{}", game_id, player);
    let stake: GameStake = deps
        .storage
        .get(stake_key.as_bytes())
        .and_then(|b| cosmwasm_std::from_slice(&b).ok())
        .unwrap_or(GameStake {
            player,
            game_id,
            outcome: 0,
            amount: Uint128::zero(),
        });

    to_binary(&stake)
}