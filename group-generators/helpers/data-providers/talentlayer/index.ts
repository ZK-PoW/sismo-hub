import {
  getReviewsByMinRatingQuery,
  getServicesByBuyerQuery,
  getServicesByTopicQuery,
  getUsersWithTalentLayerIdQuery,
  getUserTotalSalaryQuery,
} from "./queries";
import { ReviewsType, ServicesType, UsersType } from "./types";
import { GraphQLProvider } from "@group-generators/helpers/data-providers/graphql";
import { FetchedData } from "topics/group";

export class TalentLayerProvider extends GraphQLProvider {
  constructor() {
    super({
      url: "https://api.thegraph.com/subgraphs/name/talentlayer/talent-layer-mumbai",
    });
  }

  /**
   * Get all users with a talent layer id
   */
  private async processUsersWithTalentLayerId(): Promise<FetchedData> {
    const dataProfiles: FetchedData = {};
    const response: UsersType = await getUsersWithTalentLayerIdQuery(this);
    response.users.forEach((user) => {
      dataProfiles[user.address] = 1;
    });
    return dataProfiles;
  }

  public async getUsersWithTalentLayerId(): Promise<FetchedData> {
    return this.processUsersWithTalentLayerId();
  }

  public async getUsersWithTalentLayerIdCount(): Promise<number> {
    return Object.keys(await this.processUsersWithTalentLayerId()).length;
  }

  /**
   * Get Talent that worked with a buyer
   */
  private async processDidSellerServiceBuyer(
    buyer: string,
    numberOfTimes: number
  ): Promise<FetchedData> {
    const dataProfiles: FetchedData = {};
    const response: ServicesType = await getServicesByBuyerQuery(this, buyer);
    if (response.services.length >= numberOfTimes) {
      dataProfiles[response.services[0].seller.address] = 1;
    }
    return dataProfiles;
  }

  public async didSellerServiceBuyer(
    buyer: string,
    numberOfTimes: number
  ): Promise<FetchedData> {
    return this.processDidSellerServiceBuyer(buyer, numberOfTimes);
  }

  public async didSellerServiceBuyerCount(
    buyer: string,
    numberOfTimes: number
  ): Promise<number> {
    return Object.keys(
      await this.processDidSellerServiceBuyer(buyer, numberOfTimes)
    ).length;
  }

  /**
   * Get Talent experienced in a topic
   */
  private async processDidWorkOnTopic(
    topic: string,
    numberOfTimes: number
  ): Promise<FetchedData> {
    const dataProfiles: FetchedData = {};
    const response: ServicesType = await getServicesByTopicQuery(this, topic);
    const countByUser: { [address: string]: number } = {};

    response.services.forEach((service) => {
      countByUser[service.seller.address] =
        countByUser[service.seller.address] || 0 + 1;
    });

    Object.keys(countByUser).forEach((address) => {
      if (countByUser[address] >= numberOfTimes) {
        dataProfiles[address] = 1;
      }
    });
    return dataProfiles;
  }

  public async didWorkOnTopic(
    topic: string,
    numberOfTimes: number
  ): Promise<FetchedData> {
    return this.processDidWorkOnTopic(topic, numberOfTimes);
  }

  public async didWorkOnTopicCount(
    topic: string,
    numberOfTimes: number
  ): Promise<number> {
    return Object.keys(await this.processDidWorkOnTopic(topic, numberOfTimes))
      .length;
  }

  /**
   * Get Talent that earned a minium salary
   */
  public async getUserTotalSalary(userAddress: string): Promise<FetchedData> {
    const userGains: FetchedData = {};
    const response: UsersType = await getUserTotalSalaryQuery(
      this,
      userAddress
    );
    response.users.forEach((user) => {
      if (user.gains && user.gains.totalGain > 1) {
        userGains[user.address] = 1;
      }
    });
    return userGains;
  }

  /**
   * Get Talent having multiple rating with a defined minimum
   */
  private async processDidWorkWithRating(
    minRating: number,
    numberOfTimes: number
  ): Promise<FetchedData> {
    const dataProfiles: FetchedData = {};
    const response: ReviewsType = await getReviewsByMinRatingQuery(
      this,
      minRating
    );
    const countByUser: { [address: string]: number } = {};

    response.reviews.forEach((review) => {
      if (review.to.address == review.service.seller.address) {
        countByUser[review.to.address] =
          countByUser[review.to.address] || 0 + 1;
      }
    });

    Object.keys(countByUser).forEach((address) => {
      if (countByUser[address] >= numberOfTimes) {
        dataProfiles[address] = 1;
      }
    });
    return dataProfiles;
  }

  public async didWorkWithRating(
    minRating: number,
    numberOfTimes: number
  ): Promise<FetchedData> {
    return this.processDidWorkWithRating(minRating, numberOfTimes);
  }

  public async didWorkWithRatingCount(
    minRating: number,
    numberOfTimes: number
  ): Promise<number> {
    return Object.keys(
      await this.processDidWorkWithRating(minRating, numberOfTimes)
    ).length;
  }
}
